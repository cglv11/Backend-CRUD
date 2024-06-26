const { response } = require('express');
const bcryptjs = require('bcryptjs')

const User = require('../models/user');
const { generateJWT } = require('../helpers');

const usersGet = async (req, res = response) => {

    try {
        
        const [ total, users ] = await Promise.all([
            User.countDocuments({ state: true }),
            User.find({ state: true })
        ]);
    
        res.json({
            total,
            users
        })
    } catch (error) {

        console.error(error);
        res.status(500).json({
            msg: 'Ocurrió un error inesperado. Por favor, intente nuevamente.'
        });
    }
}

const userGet = async (req, res = response) => {

    const { id } = req.params;

    try {
        
        const user = await User.findById( id );

        if(!user){
            return res.status(404).json({
                msg: 'Usuario no encontrado',
            });
        }
        
        res.json(user)
            
    } catch (error) {
        
        console.error(error);
        res.status(500).json({
            msg: 'Ocurrió un error inesperado. Por favor, intente nuevamente.'
        });
    }
}

const usersPost = async (req, res = response) => {
    
    var { name, email, phone, password } = req.body;

    try {
       
        const userDBEmail = await User.findOne({ email: email, state: true });

        if(userDBEmail) {

            return res.status(400).json({
                msg: `El correo ${userDBEmail.email}, ya existe`,
            });
        }

        const user = new User({ name, email, phone, password });

        // Encriptar la contraseña
        const salt = bcryptjs.genSaltSync();
        user.password = bcryptjs.hashSync( password, salt );
    
        // Guardar en BD
        await user.save();

        const token = await generateJWT( user.id );
        
        res.status(202).json({
            user,
            token
        });

    } catch (error) {
        // Handle other errors or pass them to a global error handler
        console.error(error);
        res.status(500).json({
            msg: 'Ocurrió un error inesperado. Por favor, intente nuevamente.'
        });
    }
};



const usersPut = async (req, res = response) => {
    const { id } = req.params;
    let { _id, password, email, ...rest } = req.body;

    try {
        if (email) {

            // Se valida que el nuevo email no exista ya con otro usuario
            const userDBEmail = await User.findOne({ email: email, state: true });

            if (userDBEmail && userDBEmail._id.toString() !== id) {
                return res.status(400).json({
                    msg: `El correo ${userDBEmail.email}, ya existe`,
                });
            } else {
                // Si el email es valido entonce incluirlo en la actualización
                rest.email = email;
            }
        }

        const user = await User.findByIdAndUpdate(id, rest);

        if (!user) {
            return res.status(404).json({
                msg: 'Usuario no encontrado',
            });
        }
        res.json(user);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            msg: 'Ocurrió un error inesperado al actualizar el usuario. Por favor, intente nuevamente.'
        });
    }
};




const usersDelete = async (req, res = response) => {
        
    const { id } = req.params;

    const user = await User.findByIdAndUpdate( id, { state: false } )

    res.json({
        msg: 'Se ha eliminado el usuario',
        user,
    })
} 


module.exports = {
    userGet,
    usersGet,
    usersPut,
    usersPost,
    usersDelete
}
