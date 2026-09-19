// const sseAuthMiddleware = (req, res, next) => {
//   try {
//     // Pastikan user sudah berhasil diautentikasi
//     if (!req.user) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized.",
//       });
//     }

//     // Pastikan hanya owner yang dapat membuka SSE
//     if (req.user.role !== "owner") {
//       return res.status(403).json({
//         success: false,
//         message: "Access denied.",
//       });
//     }

//     next();
//   } catch (error) {
//     console.error("SSE Authentication Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Internal Server Error.",
//     });
//   }
// };

// export default sseAuthMiddleware;