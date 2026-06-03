export function generateOtp() {
  let otp = Math.floor(100000 + Math.random() * 900000);
  return otp;
}
