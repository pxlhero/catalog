// @flow
import webpack from 'webpack';
import WebpackDevServer from 'webpack-dev-server';
import historyApiFallback from 'connect-history-api-fallback';

export default async (config: Object, host: string, port: number, protocol: string, paths: Object, framework: string): Promise<string> => {
  const compiler = webpack(config);
  const devServer = new WebpackDevServer(compiler, {
    compress: true,
    clientLogLevel: 'none',
    // FIXME: for next.js use app root
    contentBase: framework === 'CREATE_REACT_APP' ? paths.appPublic : paths.appRoot,
    hot: true,
    publicPath: config.output.publicPath,
    quiet: true,
    // Reportedly, this avoids CPU overload on some systems.
    // https://github.com/facebookincubator/create-react-app/issues/293
    watchOptions: {
      ignored: /node_modules/
    },
    https: protocol === 'https',
    host: host
  });

  // Our custom middleware proxies requests to /index.html or a remote API.
  devServer.use(historyApiFallback({
    // Paths with dots should still use the history fallback.
    // See https://github.com/facebookincubator/create-react-app/issues/387.
    disableDotRule: true,
    // For single page apps, we generally want to fallback to /index.html.
    // However we also want to respect `proxy` for API calls.
    // So if `proxy` is specified, we need to decide which fallback to use.
    // We use a heuristic: if request `accept`s text/html, we pick /index.html.
    // Modern browsers include text/html into `accept` header when navigating.
    // However API calls like `fetch()` won’t generally accept text/html.
    // If this heuristic doesn’t work well for you, don’t use `proxy`.
    htmlAcceptHeaders: ['text/html', '*/*']
  }));

  // Finally, by now we have certainly resolved the URL.
  // It may be /index.html, so let the dev server try serving it again.
  devServer.use(devServer.middleware);

  // Launch WebpackDevServer.
  return new Promise((resolve, reject) => {
    devServer.listen(port, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(protocol + '://' + host + ':' + port + '/');
      }
    });
  });
};