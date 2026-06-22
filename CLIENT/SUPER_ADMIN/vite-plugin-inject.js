export default function vitePluginInject() {
  return {
    name: "vite-plugin-inject",
    enforce: "post",
    transformIndexHtml(html, ctx) {
      if (ctx.chunk?.isEntry) {
        let cssBuild = [...ctx.chunk.viteMetadata.importedCss][0];

        let script = "";
        let link = "";

        html = html.replace(
          new RegExp(
            "<script[^<>]+" + ctx.chunk.fileName + "[^<>]+><\/script>",
          ),
          (match) => {
            script = match;
            return "";
          },
        );
        html = html.replace(
          new RegExp("<link[^<>]+" + cssBuild + "[^<>]+>"),
          (match) => {
            link = match;
            return "";
          },
        );

        html = html.replace("</body>", `${link}\n${script}\n</body>`);
      }

      return html;
    },
  };
}
