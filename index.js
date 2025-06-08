const express = require('express');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt')


const PORT = process.env.PORT || 3000;


const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
    }
  }
);

const app = express();
app.use(express.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

//O API DE LOGIN É O /admin/login que está NO FINAL DO CÓDIGO

/* Rota de login do SUPABASE (eu tentei)
app.post('/login', async (req, res) => {
const { email, password } = req.body;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data || !data.session) {
    console.error('Erro ao fazer login:', error || 'Sessão não encontrada');
    return res.status(401).json({ error: "Credenciais inválidas ou usuário não encontrado" });
  }

  res.json({
    access_token: data.session.access_token,
  });
});


// Testando com RLS ativo
async function testAdminAccess() {
  const { data, error } = await supabase
    .from('user_admin')
    .select('*')
    .eq('id', '57102116-ee3d-4441-aad8-2ca82891b451')

  if (error) console.error('Erro:', error)
  else console.log('Dados admin:', data)
}
*/

//Mensagem que aparece ao iniciar o servidor
app.get("/", (req, res) => {
    res.json({ message: "Bem-vindo à API de usúarios!" })
});

//Lista todos admins registrados
app.get("/user_admin", async (req, res) =>{
    try {
        let {data, error } = await supabase.from('user_admin').select('*')
        if (error) throw error
        res.status(200).json(data)
    } catch (error){
        res.status(500).json({ erro: "Erro ao obter os admins" })
    }
})

//Lista admin por ID especifico
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

//Cria um administrador novo
app.post("/user_admin", async (req, res) => {
    const salt =await bcrypt.genSalt(10); //Gera um salt para o hash da senha do usuario 
    const hashedPassword = await bcrypt.hash(req.body.admin_password, salt); //Cria um hash (Encriptar) para a senha do usuario
    const { admin_username, admin_email, admin_password, /*admin_cnpj, admin_phone_number*/} = req.body;
//verifica se a aba de email, usuario, senha, telefone e cpnj estão preenchidos (Caso for utilizar a versão teste, deixe phone e CNPJ como comentario)
    if (!admin_username || !admin_email || !admin_password /*||!admin_phone_number ||admin_cnpj*/) {
        return res.status(400).json({ error: "Usuário, email, senha e número são obrigatórios." });
    }

    //Valida o email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(admin_email)) {
        return res.status(400).json({ error: "Email inválido." });
    }

    //verifica se o usuario já está sendo utilizado
    const { data: existingUser, error: selectEmailError } = await supabase
        .from('user_admin')
        .select('admin_id')
        .eq('admin_email', admin_email)
        .single();

    if (existingUser) {
        return res.status(400).json({ error: "Email já cadastrado." });
    }
//Pede que o usuario tenha pelo menos 6 digitos na senha
    if (admin_password.length < 6) {
        return res.status(400).json({ error: "A senha deve ter pelo menos 6 caracteres." });
    } //o mesmo de cima, só que com número
     /*if (admin_phone_number < 9 ){
        return res.status(400).json({ error: "O número de telefone deve ter pelo menos X dígitos." });
    } //mesma coisa que o usuario registrado, só que com o telefone
    const { data: existingNumber, error: selectNumberError } = await supabase
        .from('user_admin')
        .select('admin_phone_number')
        .eq('admin_phone_number', admin_phone_number)
        .single();

    if (existingNumber) {
        return res.status(400).json({ error: "Número já cadastrado." });
    } */
    
//finalmente registra o usuario
    const { data, error } = await supabase
        .from('user_admin')
        .insert([{
            admin_username,
            admin_email,
            admin_password: hashedPassword,
            //admin_cnpj
            //admin_phone_number
        }])
        .select('*');
//mensagem de erro que envia mensagem ao terminal caso tenha um erro
    if (error) {
        console.log(error);
        return res.status(400).json({ error: "Erro ao criar usuário" });
    }
    res.status(201).json({ message: "Usuário criado com sucesso!" });
    console.log(salt)
    console.log (hashedPassword)
});

//modifica uma conta já registrada pelo ID no URL
app.put('/user_admin/:id', async (req, res) => {
    const { error } = await supabase
        .from('user_admin')
        .update({
            admin_username: req.body.admin_username,
            admin_email: req.body.admin_email,
            admin_password: req.body.admin_password,
            admin_phone: req.body.admin_phone
            //,admin_cnpj
            //admin_phone_number
        })
        .eq('admin_id', req.params.id);
    if (error) {
        console.log(error)
        return res.status(400).json({ error: "Erro ao atualizar usuário" });
    }
    res.status(201).json({message:"Usuário atualizado com sucesso!",});
}); 
//Apaga um usuario pelo ID na URL
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
// Assim como o GET, porém não salva o usuario no browser. Yule pediu pra eu criar, já que POST de fato é melhor que GET pra Login
app.post("/user_adminData", async (req, res) =>{
    try {
        let {data, error } = await supabase.from('user_admin').select('*')
        if (error) throw error
        res.status(200).json(data)
    } catch (error){
        res.status(500).json({ erro: "Erro ao obter os admins" })
    }
})
// Segue a aba de login abaixo
app.post("/user_admin/login", async (req, res) => {
    try {
        const { admin_email, admin_password } = req.body;

        // Busca usuario e senha para login
        const { data: user, error } = await supabase
            .from("user_admin")
            .select("*")
            .eq("admin_email", admin_email)
            .single();

        if (error || !admin_email) {
            return res.status(404).json({ error: "Usuário não encontrado" });
        }

        const samePassword = await bcrypt.compare(admin_password, user.admin_password);

        if (samePassword) {
            res.send("Login realizado com sucesso!");
        } else {
            res.status(401).json("Senha incorreta!");
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Erro ao comparar a senha" });
    }
}); //LEMBRANDO: TODA SENHA REGISTRADA NO BD ESTÁ ENCRIPTADA, ENTÃO ANOTE PRA NÃO ESQUECER DEPOIS!


// Manda mensagem no terminal da posta que está funcionando
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Servidor rodando na porta ${PORT}`));


//A chave e URL do supa estão no .env