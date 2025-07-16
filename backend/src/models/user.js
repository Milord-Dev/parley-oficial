import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    nombreCompleto: {
        type: String,
        required: true,
        trim: true //para quitar espacios en blacno
    },
    email: {
        type: String,
        required: true,
        unique: true, // no puede haber dos usuarios con el mismo email
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
 
    fechaNacimiento: {
        type: Date,
        required: true
    },
    telefono: {
        type: String
    }

}, {
    // agñade automáticamente los campos createdAt y updatedAt
    timestamps: true
});

// Creamos y exportamos el modelo
const User = mongoose.model('User', userSchema);
export default User;