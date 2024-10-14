import { Request, Response, NextFunction } from "express";

const responseInterceptor = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const originalSend = res.json.bind(res);

  res.json = (body: any) => {
    const customResponse = {
      status: res.statusCode,
      message: getStatusMessage(res.statusCode),
      data: body,
    };

    return originalSend(customResponse);
  };

  next();
};

// Helper function to get status messages
const getStatusMessage = (statusCode: number) => {
  switch (statusCode) {
    case 200:
      return "Success";
    case 201:
      return "Created";
    case 400:
      return "Bad Request";
    case 401:
      return "Unauthorized";
    case 404:
      return "Not Found";
    case 409:
      return "Conflict";
    case 500:
      return "Internal Server Error";
    default:
      return "Unknown status";
  }
};

export default responseInterceptor;
