import mongoose from 'mongoose'
import bcrypt from "bcrypt"

const mensajeroSchema = mongoose.Schema({
    nombres: {
        type: String,
        trim: true,
        required: true
    },
    cedula: {
        type: String,
        trim: true,
        required: true
    },
    telefono: {
        type: String,
        trim: true,
        required: true
    },
    usuario: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true,
        trim: true
    },
    domicilios: [
        {
        type: String,
        required: true
        }
    ],
    domiciliosCompleRuta: [
        {
            type: String,
            required: true
        }
    ],
    totalDomis: {
        type: Number,
        default: 0
    },
    totalDomisCompletados: {
        type: Number,
        default: 0
    },
    totalDomisPendientes: {
        type: Number,
        default: 0
    },
    totalGanancia: {
        type: Number,
        default: 0
    },
    totalRecibido: {
        type: Number,
        default: 0
    },
    diferencia: {
        type: Number,
        default: 0
    }
})

mensajeroSchema.pre('save', async function (next) {
    // Si no está modificado el password, que no haga nada
    if (!this.isModified('password')) {
        next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
} )

mensajeroSchema.methods.comprobarPassword = async function (passwordFormulario) {
    return await bcrypt.compare(passwordFormulario, this.password)
}

const Mensajero = mongoose.model('Mensajero', mensajeroSchema)

export default Mensajero