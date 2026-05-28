declare module "arabic-persian-reshaper" {
  const arabic: {
    processArabic: (text: string) => string;
  };

  export default arabic;
}