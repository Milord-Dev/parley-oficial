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
        required: [true, 'La fecha de nacimiento es obligatoria.'],
    // validador
        validate: {
        validator: function(birthDate) {
            // Calculamos la fecha que corresponde a hace 18 años
            const date18YearsAgo = new Date();
            date18YearsAgo.setFullYear(date18YearsAgo.getFullYear() - 18);
            // La fecha de nacimiento debe ser anterior o igual a esa fecha
            return birthDate <= date18YearsAgo;
        },
        message: 'El usuario debe ser mayor de 18 años.'
        }
    },
    telefono: {
        type: String
    },

    balance: {
        type: Number,      // Guardaremos el saldo como un número.
        required: true,    
        default: 0,        //cuando se registra un nuevo usuario su saldo inicial es 0.
        min: 0             // para que el saldo no sea negativo (por si acaso)
    }

}, {
    // agñade automáticamente los campos createdAt y updatedAt
    timestamps: true
});

// Creamos y exportamos el modelo
const User = mongoose.model('User', userSchema);
export default User;