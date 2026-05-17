const API = "https://optimistic-friendship-production-2743.up.railway.app";

const cadastroForm = document.getElementById("cadastroForm");
if (cadastroForm) {
 cadastroForm.addEventListener("submit", async (e) => {
 e.preventDefault();

 const dados = {
 nome: document.getElementById("nome").value,
 email: document.getElementById("email").value,
 senha: document.getElementById("senha").value,
 tipo_usuario: document.getElementById("tipo_usuario").value
 };

 const res = await fetch(API + "/cadastro", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify(dados)
 });

 const data = await res.json();
 alert(data.mensagem || data.erro);
 });
}
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const dados = {
      email: document.getElementById("loginEmail").value,
      senha: document.getElementById("loginPassword").value
    };

    const res = await fetch(API + "/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados)
    });

    if (res.status === 401) {
      alert("Login inválido");
      return;
    }

    const data = await res.json();
    alert("Login realizado!");
    window.location.href = "index.html";
  });
}