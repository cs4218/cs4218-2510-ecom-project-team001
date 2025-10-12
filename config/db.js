import mongoose from "mongoose";
import colors from "colors";

const connectDB = async () => {
  try {
    // TODO: Would disable connecting to real DB when running tests,
    // but a test depends on this logic.
    const mongoUrl = process.env.MONGO_URL;

    const conn = await mongoose.connect(mongoUrl);

    console.log(
      `Connected To Mongodb Database ${conn.connection.host}`.bgMagenta.white
    );
  } catch (error) {
    console.error(`Error in Mongodb ${error}`.bgRed.white);
  }
};

export default connectDB;
