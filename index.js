const express = require('express');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const bodyParser = require('body-parser');




const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const PORT = process.env.PORT

const app = express();
app.use(express.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

const supabase = createClient(supabaseUrl, supabaseKey);

app.get("/", (req, res) => {
    res.json({ message: "Bem-vindo à API de usúarios!" })
});

app.get("/user_admin", async (req, res) =>{
    try {
        let {data, error } = await supabase.from('user_admin').select('*')
        if (error) throw error
        res.status(200).json(data)
    } catch (error){
        res.status(500).json({ erro: "Erro ao obter os admins" })
    }
})

app.get("/user_admin/:id", async (req, res) => {
    try {
        const { id } = req.params;
        let { data, error } = await supabase.from('user_admin').select('*').eq('admin_id', id).single();
        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        console.log(error)
        res.status(404).json({ erro: "Administrador não encontrado" });
    }
})


app.post("/user_admin", async (req, res) => {
    const { admin_username, admin_email, admin_password /*, admin_phone_number */} = req.body;

    if (!admin_username || !admin_email || !admin_password /*||!admin_phone_number */) {
        return res.status(400).json({ error: "Usuário, email e senha são obrigatórios." });
    }

    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(admin_email)) {
        return res.status(400).json({ error: "Email inválido." });
    }

    
    const { data: existingUser, error: selectError } = await supabase
        .from('user_admin')
        .select('admin_id')
        .eq('admin_email', admin_email)
        .single();

    if (existingUser) {
        return res.status(400).json({ error: "Email já cadastrado." });
    }

    if (admin_password.length < 6) {
        return res.status(400).json({ error: "A senha deve ter pelo menos 6 caracteres." });
    }
    /* if (admin_phone_number < X (Não sei quantia minima)){
        return res.status(400).json({ error: "O número de telefone deve ter pelo menos X dígitos." });
    }
    const { data: existingNumber, error: selectError } = await supabase
        .from('user_admin')
        .select('admin_phone_number')
        .eq('admin_phone_number', admin_phone_number)
        .single();

    if (existingNumber) {
        return res.status(400).json({ error: "Número já cadastrado." });
    }
    */

    const { data, error } = await supabase
        .from('user_admin')
        .insert([{
            admin_username,
            admin_email,
            admin_password //, quando passar para o servidor oficial, retire o comentario
            //admin_phone_number
        }])
        .select('*');

    if (error) {
        console.log(error);
        return res.status(400).json({ error: "Erro ao criar usuário" });
    }
    res.status(201).json({ message: "Usuário criado com sucesso!" });
});


app.put('/user_admin/:id', async (req, res) => {
    const { error } = await supabase
        .from('user_admin')
        .update({
            admin_username: req.body.admin_username,
            admin_email: req.body.admin_email,
            admin_password: req.body.admin_password
            //admin_phone: req.body.admin_phone
        })
        .eq('admin_id', req.params.id);
    if (error) {
        console.log(error)
        return res.status(400).json({ error: "Erro ao atualizar usuário" });
    }
    res.status(201).json({message:"Usuário atualizado com sucesso!",});
}); 

app.delete("/user_admin/:id", async (req, res) => {
    try {
        const { id } = req.params;
        let { error } = await supabase.from('user_admin').delete().eq('admin_id', id);
        if (error) throw error;
        return res.status(200).json({ message: "Usuário deletado com sucesso!" });
    } catch (error) {
        res.status(400).json({ erro: "Erro ao deletar usuário" });
    }
}); 

const port = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
