/**
 * Utilitário inteligente para remoção de fundos sólidos (escuros ou claros)
 * em logotipos enviados pelo usuário para Sanches & Marques Esquadrias.
 * 
 * Etapas:
 * 1. Ignora SVGs e imagens que já possuem transparência nativa.
 * 2. Determina fundo escuro ou claro pela mediana dos 4 cantos.
 * 3. Estima o fundo como um campo suave (grade com média de pixels parecidos com fundo,
 *    interpolação e suavização), suportando vinhetas e reflexos de estúdio.
 * 4. Calcula alpha = clamp((diferença - 26) / 60) com recuperação da cor original (un-premultiply).
 * 5. Recorta precisamente pelo bounding box dos pixels visíveis e devolve PNG transparente.
 */

export async function removeSolidLogoBackground(dataUrl: string): Promise<string> {
  // 1. Ignorar SVGs diretamente
  if (dataUrl.startsWith('data:image/svg+xml')) {
    return dataUrl;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;

        if (!width || !height) {
          resolve(dataUrl);
          return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        // Verificar se já possui transparência
        let transparentPixelCount = 0;
        const sampleStep = Math.max(1, Math.floor((width * height) / 5000));
        for (let i = 3; i < data.length; i += sampleStep * 4) {
          if (data[i] < 220) {
            transparentPixelCount++;
          }
        }
        // Se mais de 1.5% dos pixels já são transparentes, preserva o arquivo original
        if (transparentPixelCount > 30) {
          resolve(dataUrl);
          return;
        }

        // 2. Decidir fundo escuro ou claro pela mediana dos 4 cantos
        const cornerCoords = [
          [0, 0],
          [width - 1, 0],
          [0, height - 1],
          [width - 1, height - 1],
        ];

        const cornerColors = cornerCoords.map(([cx, cy]) => {
          const idx = (cy * width + cx) * 4;
          return [data[idx], data[idx + 1], data[idx + 2]];
        });

        const cornerLums = cornerColors
          .map(([r, g, b]) => 0.299 * r + 0.587 * g + 0.114 * b)
          .sort((a, b) => a - b);
        const medianLum = (cornerLums[1] + cornerLums[2]) / 2;
        const isDarkBg = medianLum < 128;

        // 3. Estimar o fundo como um campo suave usando grade (16x16 células)
        const gridX = 16;
        const gridY = 16;
        const cellW = width / gridX;
        const cellH = height / gridY;

        interface GridCell {
          r: number;
          g: number;
          b: number;
          valid: boolean;
        }

        const grid: GridCell[][] = [];

        for (let gy = 0; gy < gridY; gy++) {
          const row: GridCell[] = [];
          for (let gx = 0; gx < gridX; gx++) {
            const x0 = Math.floor(gx * cellW);
            const x1 = Math.min(width, Math.floor((gx + 1) * cellW));
            const y0 = Math.floor(gy * cellH);
            const y1 = Math.min(height, Math.floor((gy + 1) * cellH));

            let sumR = 0;
            let sumG = 0;
            let sumB = 0;
            let count = 0;

            const step = Math.max(1, Math.floor(((x1 - x0) * (y1 - y0)) / 40));

            for (let y = y0; y < y1; y += 2) {
              for (let x = x0; x < x1; x += 2) {
                const idx = (y * width + x) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                const lum = 0.299 * r + 0.587 * g + 0.114 * b;
                const sat = Math.max(r, g, b) - Math.min(r, g, b);

                const isBgPixel = isDarkBg
                  ? lum < medianLum + 35 && sat < 45
                  : lum > medianLum - 40 && sat < 40;

                if (isBgPixel) {
                  sumR += r;
                  sumG += g;
                  sumB += b;
                  count++;
                }
              }
            }

            if (count >= 4) {
              row.push({
                r: sumR / count,
                g: sumG / count,
                b: sumB / count,
                valid: true,
              });
            } else {
              row.push({ r: 0, g: 0, b: 0, valid: false });
            }
          }
          grid.push(row);
        }

        // Preencher células sem pixels de fundo com vizinhos válidos
        for (let gy = 0; gy < gridY; gy++) {
          for (let gx = 0; gx < gridX; gx++) {
            if (!grid[gy][gx].valid) {
              let wSumR = 0;
              let wSumG = 0;
              let wSumB = 0;
              let wTotal = 0;

              for (let oy = 0; oy < gridY; oy++) {
                for (let ox = 0; ox < gridX; ox++) {
                  if (grid[oy][ox].valid) {
                    const dist = Math.hypot(gx - ox, gy - oy) + 0.1;
                    const weight = 1 / (dist * dist);
                    wSumR += grid[oy][ox].r * weight;
                    wSumG += grid[oy][ox].g * weight;
                    wSumB += grid[oy][ox].b * weight;
                    wTotal += weight;
                  }
                }
              }

              if (wTotal > 0) {
                grid[gy][gx] = {
                  r: wSumR / wTotal,
                  g: wSumG / wTotal,
                  b: wSumB / wTotal,
                  valid: true,
                };
              } else {
                // Fallback para mediana dos cantos
                const avgCorner = cornerColors[0];
                grid[gy][gx] = {
                  r: avgCorner[0],
                  g: avgCorner[1],
                  b: avgCorner[2],
                  valid: true,
                };
              }
            }
          }
        }

        // Interpolação bilinear do fundo estimado no ponto (x, y)
        const getInterpolatedBg = (x: number, y: number): [number, number, number] => {
          const gx = (x + 0.5) / cellW - 0.5;
          const gy = (y + 0.5) / cellH - 0.5;

          const x0 = Math.max(0, Math.min(gridX - 1, Math.floor(gx)));
          const x1 = Math.max(0, Math.min(gridX - 1, x0 + 1));
          const y0 = Math.max(0, Math.min(gridY - 1, Math.floor(gy)));
          const y1 = Math.max(0, Math.min(gridY - 1, y0 + 1));

          const fx = Math.max(0, Math.min(1, gx - x0));
          const fy = Math.max(0, Math.min(1, gy - y0));

          const c00 = grid[y0][x0];
          const c10 = grid[y0][x1];
          const c01 = grid[y1][x0];
          const c11 = grid[y1][x1];

          const r =
            (1 - fx) * (1 - fy) * c00.r +
            fx * (1 - fy) * c10.r +
            (1 - fx) * fy * c01.r +
            fx * fy * c11.r;
          const g =
            (1 - fx) * (1 - fy) * c00.g +
            fx * (1 - fy) * c10.g +
            (1 - fx) * fy * c01.g +
            fx * fy * c11.g;
          const b =
            (1 - fx) * (1 - fy) * c00.b +
            fx * (1 - fy) * c10.b +
            (1 - fx) * fy * c01.b +
            fx * fy * c11.b;

          return [r, g, b];
        };

        // 4. Calcular alpha = clamp((diferença - 26) / 60) e desmisturar cor
        let minX = width;
        let maxX = 0;
        let minY = height;
        let maxY = 0;

        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            const [bgR, bgG, bgB] = getInterpolatedBg(x, y);

            const diff = Math.sqrt(
              (r - bgR) * (r - bgR) +
              (g - bgG) * (g - bgG) +
              (b - bgB) * (b - bgB)
            );

            // Fórmula calibrada: clamp((diferença - 26) / 60)
            const alpha = Math.max(0, Math.min(1, (diff - 26) / 60));

            if (alpha < 0.01) {
              data[idx] = 0;
              data[idx + 1] = 0;
              data[idx + 2] = 0;
              data[idx + 3] = 0;
            } else {
              // Recuperação da cor original (un-premultiply)
              const nr = Math.max(0, Math.min(255, Math.round((r - (1 - alpha) * bgR) / alpha)));
              const ng = Math.max(0, Math.min(255, Math.round((g - (1 - alpha) * bgG) / alpha)));
              const nb = Math.max(0, Math.min(255, Math.round((b - (1 - alpha) * bgB) / alpha)));
              const na = Math.round(alpha * 255);

              data[idx] = nr;
              data[idx + 1] = ng;
              data[idx + 2] = nb;
              data[idx + 3] = na;

              if (na > 20) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
              }
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);

        // 5. Recortar pelo bounding box com margem de segurança de 4px
        if (minX <= maxX && minY <= maxY) {
          const pad = 4;
          const cropX = Math.max(0, minX - pad);
          const cropY = Math.max(0, minY - pad);
          const cropW = Math.min(width - cropX, (maxX - minX + 1) + pad * 2);
          const cropH = Math.min(height - cropY, (maxY - minY + 1) + pad * 2);

          const cropCanvas = document.createElement('canvas');
          cropCanvas.width = cropW;
          cropCanvas.height = cropH;
          const cropCtx = cropCanvas.getContext('2d');
          if (cropCtx) {
            cropCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
            resolve(cropCanvas.toDataURL('image/png'));
            return;
          }
        }

        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        console.error('Erro na remoção de fundo da logo:', err);
        resolve(dataUrl);
      }
    };

    img.onerror = () => {
      resolve(dataUrl);
    };

    img.src = dataUrl;
  });
}
