import mongoose from 'mongoose';

const outcomeSchema = new mongoose.Schema({
    name:{type:String, required: true}, // 'Home Team', 'Away Team', 'Draw'
    price:{type:Number, required: true}, // Precio de la apuesta
    point:{type:Number, required: true}, // Si es una apuesta de spread
});

const marketSchema = new mongoose.Schema({
    key:{type:String, required: true}, //'h2h', 'totals', 'spreads'
    last_update:{type:Date, required: true},
    outcomeSchema:[outcomeSchema], // Array de posibles resultados (victoria local, empate, victoria visitante)
    // bookmakers: [bookmakerSchema] // Si quisieras guardar diferentes casas de apuestas, lo dejaremos simple por ahora
})

const eventSchema = new mongoose.Schema({
    id:{type:String, unique:true, required: true}, // Array de posibles resultados (victoria local, empate, victoria visitante)
    // bookmakers: [bookmakerSchema] // Si quisieras guardar diferentes casas de apuestas, lo dejaremos simple por ahora
    sport_key:{type:String, required: true},
    sport_title:{type:String, required: true},
    commence_time:{type:Date, required: true},
    home_team:{type:String, required: true},
    away_team:{type:String,required: true},

    // Aquí guardaremos las cuotas principales para moneyline
    main_moneyline_odds:{
        type: marketSchema,
        required: false // Puede que no todos los eventos tengan cuotas moneyline
    },

    // Esto es para saber cuándo se actualizaron las cuotas por última vez
    last_odds_update:{type:Date, default:Date.now},
    },
    {timestamps: true}
);

export const Event = mongoose.model('Event',eventSchema)
