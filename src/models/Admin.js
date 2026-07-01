import mongoose from "mongoose";
import bcrypt from 'bcrypt'
import generarId from "../helpers/generarId.js";

const adminSchema = mongoose.Schema({
    nombre: {
        type: String,
        trim: true,
        required: true
    },
    correo: {
        type: String,
        required: true
    },
    usuario: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    token: {
        type: String,
        default: generarId()
    },
    confirmado: {
        type: Boolean,
        default: false
    }
})

adminSchema.pre('save', async function (next) {
    if(!this.isModified("password")){
        next()
    }
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
} )

adminSchema.methods.comprobarPassword = async function (passwordFormulario) {
    return await bcrypt.compare(passwordFormulario, this.password)
}

const Admin = mongoose.model('Admin', adminSchema)

export default Admin