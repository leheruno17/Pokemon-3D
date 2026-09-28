# Poké Dimension

Uma galeria interativa em português, feita com HTML, Tailwind CSS, JavaScript e Three.js. As três cartas fornecidas são utilizadas diretamente, sem depender de um serviço externo de imagens.

## Executar

Requer Node.js 20.19+ ou 22+ e npm.

```sh
npm install
npm run dev
```

Abra o endereço exibido pelo Vite. Não abra `index.html` diretamente via `file://`: os módulos e modelos precisam de um servidor HTTP.

```sh
npm run build
npm run preview
```

O build estático é gerado em `dist/`. As fontes Google são opcionais: sem conexão, o layout usa as fontes de fallback. As demais dependências ficam no build.

### Live Server / preview do VS Code

Ao abrir o `index.html` da raiz em um servidor de preview, ele encaminha automaticamente para `dist/index.html`, que contém o CSS e o JavaScript já compilados. O build usa caminhos relativos para funcionar também em subpastas. Execute `npm run build` após alterar os arquivos para atualizar esse preview. Para ver alterações imediatamente durante o desenvolvimento, use `npm run dev`.

## Modelos GLB

Os anexos incluem cartas e vídeos, **mas não incluem arquivos GLB**. Por isso, a aplicação oferece interpretações 3D estilizadas, construídas com geometria procedural, claramente identificadas na cena. Não são os modelos originais dos vídeos.

Adicione seus modelos a:

```text
public/models/garchomp.glb
public/models/dragapult.glb
public/models/incineroar.glb
```

Esses arquivos são servidos como `./models/nome.glb` e carregados sob demanda com `GLTFLoader`. Depois de adicionar ou substituir um modelo, recarregue a página. O modelo é centralizado e redimensionado automaticamente; a primeira animação de idle (ou a primeira disponível) é reproduzida. Use GLB autocontido, com texturas incorporadas, orientação Y-up, frente +Z e sem compressão Draco/KTX2. A aplicação mantém o fallback se o arquivo estiver ausente, inválido ou não puder ser decodificado.

## Experiência

- Garchomp: arena rochosa, iluminação solar quente, poeira e fragmentos.
- Dragapult: névoa rasteira, iluminação roxa/ciano, orbes, cristais e levitação.
- Incineroar: ringue metálico, luzes vermelhas/douradas, vapor e brasas ascendentes.
- Transição gradual entre ambientes, modelos, partículas e iluminação.
- Cartas com inclinação 3D e brilho holográfico; painel retrátil com dados dos anexos.
- Câmera 360°, zoom, giro automático lento do modelo, pausa e tela cheia quando suportada. O botão “Giro automático” ou a tecla `R` alterna o giro; a câmera permanece livre para exploração manual.
- Coleção de favoritos persistida em `localStorage`. Os vídeos originais não são exibidos nem incluídos no build.
- Layout responsivo, diálogos acessíveis, suporte a teclado e movimento reduzido.
- URL compartilhável por Pokémon: `?pokemon=garchomp`, `?pokemon=dragapult` ou `?pokemon=incineroar`.

## Controles

| Ação | Controle |
| --- | --- |
| Girar | Arrastar / um dedo / setas com a cena em foco |
| Aproximar e afastar | Roda / pinça / `+` e `-` |
| Deslocar câmera | Botão direito / dois dedos |
| Restaurar câmera | `0` |
| Giro automático do modelo | Botão “Giro automático” / `R` |
| Tela cheia | `F` |
| Selecionar Pokémon | `1`, `2`, `3` |

## Estrutura

- `src/main.js`: estado da interface, seleção, favoritos e eventos.
- `src/scene.js`: renderização, ambientes, partículas, câmera e carregamento de GLB.
- `src/models.js`: modelos geométricos de fallback.
- `src/dragapult.js`: Dragapult refinado, com corpo e cauda contínuos, cabeça volumétrica e dois Dreepy; as asas usam faces de materiais distintas, sem placas sobrepostas.
- `src/data.js`: informações das cartas e caminhos dos assets.
- `src/style.css`: Tailwind e estilos visuais responsivos.

Os tipos são apresentados nos chips; Incineroar usa Fogo/Lutador como personalização desta experiência; o tipo do TCG pode ser diferente e está identificado nos dados da carta. O bloco “Laço com Cíntia” é descritivo, não uma habilidade de jogo. Projeto demonstrativo não oficial; Pokémon pertence aos respectivos detentores de direitos.
