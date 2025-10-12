// CRACO Configuration to fix webpack deprecation warnings
module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Remove deprecated middleware options
      if (webpackConfig.devServer) {
        delete webpackConfig.devServer.onBeforeSetupMiddleware;
        delete webpackConfig.devServer.onAfterSetupMiddleware;
        
        // Use the new setupMiddlewares option
        webpackConfig.devServer.setupMiddlewares = (middlewares, devServer) => {
          return middlewares;
        };
      }
      
      return webpackConfig;
    },
  },
};
