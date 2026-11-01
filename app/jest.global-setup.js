// Runs the tests on Indian time, where dates built from UTC land on the wrong day
module.exports = async () => {
  process.env.TZ = 'Asia/Kolkata';
};
