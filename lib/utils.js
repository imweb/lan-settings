
function exec(command) {
  return new Promise((resolve, reject) => {
    require('child_process').exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else if (stderr) {
        reject(stderr);
      } else {
        resolve(stdout);
      }
    });
  });
}



module.exports = {
  exec
};
