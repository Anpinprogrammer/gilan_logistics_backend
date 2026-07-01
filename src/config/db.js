import mongoose from "mongoose";

export const conexionDB = async () => {
    try {
        const connection = await mongoose.connect('mongodb+srv://root:root@cluster0.xeqz3.mongodb.net/jslogistics?retryWrites=true&w=majority', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        })

        const url = `${connection.connection.host}: ${connection.connection.port}`
        console.log(`Conexión establecida`);
    } catch (error) {
        console.log(error.message);
        process.exit(1)
    }
}