const package = require('./package.json');

module.exports = `
${ package.name } v${ package.version } (${ package.license })
${ package.description }

${ package.homepage }
${ package.author }
`;
