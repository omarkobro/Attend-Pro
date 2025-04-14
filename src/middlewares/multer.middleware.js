import multer from "multer";
import { allowedExtensions } from "../utils/allowedExtensions.js";
import generateUniqueString from "../utils/generateUniqueString.js";

//1- initiate the middleware function which will take the allowed extensions as a parameter
export let multerMiddleHost = (extensions = allowedExtensions.image, fileSizeLimit = 5 * 1024 * 1024) => {
  //2- determine the initial storing place which is gonna be local disk
  let storage = multer.diskStorage({
    filename: (req, file, cb) => {
      // 2.1 - generate a unique string to use it naming the files
      let uniqueFileName = generateUniqueString(5) + "_" + file.originalname;
      cb(null, uniqueFileName);
    },
  });

  //3- add the filefilter function
  let fileFilter = (req, file, cb) => {
    //3.1- check on the extensions
    if (extensions.includes(file.mimetype.split("/")[1])) {
      return cb(null, true);
    }
    cb(new Error("Image format is not allowed!"), false);
  };
let file = multer({
  storage,
  fileFilter,
  limits: { fileSize: fileSizeLimit }, 
});
  return file;
}; 