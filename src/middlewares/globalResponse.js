export let globalResponse = (err, req, res, next) => {
    const status = err.statusCode || 500;
  
    res.status(status).json({
      message: "Catch Error By Global Response",
      error_message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  };