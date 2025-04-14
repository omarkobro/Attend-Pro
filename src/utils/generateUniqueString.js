// here we'll be generating unique strings for folder names 

import { nanoid } from "nanoid"

// 1-initiate the the generation function which will take the length off the string as a parameter

let generateUniqueString = (length) =>{
    return nanoid(length)
}

export default generateUniqueString