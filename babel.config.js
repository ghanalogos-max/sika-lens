module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Lets Metro bundle the generated .sql migration files.
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
