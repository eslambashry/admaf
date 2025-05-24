import mongoose from "mongoose"


export const databaseConnection = async(req,res) =>{
    return await mongoose.connect(process.env.DB_URL)
    .then(() => console.log("Database Connected".bgBrightYellow + " ✅"))
    .catch((err) => {console.log("Database Connection Faild: ".bgBrightRed,err)})
}