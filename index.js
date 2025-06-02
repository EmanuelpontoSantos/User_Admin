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
  const {data, error } = await supabase
    .from('user_admin')
    .insert([{
      admin_username: req.body.admin_username,
      admin_email: req.body.admin_email,
      admin_password: req.body.admin_password
      //admin_phone: req.body.admin_phone
    }])
    .select('*');

  if (error) {
    console.log(error);
    return res.status(400).json({ error: "Erro ao criar usuário" });
  }
  res.status(201).json({ message: "Usuário criado com sucesso!",
   })
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
/* Deletar produto
app.delete("/user_admin/:id", async (req, res) => {
    try {
        const { id } = req.params;
        let { error } = await supabase.from('user_admin').delete().eq('id', id);
        if (error) throw error;
        res.status(204).send();
    } catch (error) {
        res.status(400).json({ erro: "Erro ao deletar usuário" });
    }
}); */

const port = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
