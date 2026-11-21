# Sidney e Raabe

Site estático mobile-first para apresentar as aulas, workshops e apresentações de forró da dupla. A página mantém o visual e as interações existentes, com HTML gerado por templates, estilos e comportamentos separados por responsabilidade.

## Desenvolvimento e build

```sh
npm install
npm run dev
```

O servidor local abre em `http://localhost:4173`. Para criar os arquivos prontos para publicar em `dist/`, rode `npm run build`. O build limpa a saída anterior, gera o HTML estático com Eleventy e concatena os módulos de CSS. Para conferir a saída de produção, use `npm run preview`.

## Estrutura

- `src/index.njk`: composição das seções da página.
- `src/_includes/layouts/`: documento, metadados e estrutura compartilhada.
- `src/_includes/partials/`: header, apresentação, formatos, dupla, galeria e contato.
- `assets/css/main.css`: bundle compilado; as fontes CSS ficam em `manifest.css`, `base.css`, `sections/`, `components/`, `motion/` e `responsive.css`.
- `assets/js/main.js`: entrada dos módulos do site; navegação, ação mobile e galeria ficam separados em `components/` e `gallery/`.
- `assets/js/preview.js` e `assets/css/preview.css`: moldura de aparelhos para conferir a página em diferentes larguras.
- `assets/images/media/`, `assets/fonts/` e `assets/icons/`: mídias otimizadas, fontes e ícone do site.
- `scripts/`: limpeza e preparação dos arquivos de publicação.
- `netlify.toml`: configuração de build, pasta publicada e cache para deploy no Netlify.

A saída `dist/` contém uma página estática, um CSS compilado, módulos JS nativos e arquivos de mídia; não depende de runtime de framework no navegador.

## Publicação no GitHub Pages

Cada push para `main` executa o workflow `.github/workflows/deploy.yml`, compila o site e publica `dist/` no GitHub Pages. O site usa caminhos relativos para assets, então funciona no subcaminho de projeto do Pages (`/SId/`). Depois do primeiro deploy, o endereço esperado é `https://xisteh.github.io/SId/`.

## Prévia responsiva

Com o servidor local ativo, abra `http://localhost:4173/preview.html`. A ferramenta mostra o site em molduras de 320, 360, 393 e 430 px, com atalhos para a abertura e a galeria.

## Mídia

- 22 fotos originais WebP e variantes menores para a galeria.
- 7 vídeos WebM para os cards verticais; o vídeo de ensino do topo permanece MP4 vertical (720 × 1280), sem recompressão.
- Capas WebP otimizadas para vídeo e imagem de destaque, carregamento tardio abaixo da primeira tela e dimensões declaradas no HTML.
- `tools/optimize_media.py` regenera as conversões; `tools/optimize_display_images.py` regenera as prévias leves. Os originais de câmera permanecem na pasta `Sidney e Raabe`.

## Antes de publicar

Confirme os três preços de exemplo e o que cada formato inclui. Configure domínio e metadados sociais para o endereço definitivo.
