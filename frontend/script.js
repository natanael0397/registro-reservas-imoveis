const API = "https://optimistic-friendship-production-2743.up.railway.app";


function salvarUsuario(usuario) {
  localStorage.setItem("usuario", JSON.stringify(usuario));
}

function getUsuario() {
  return JSON.parse(localStorage.getItem("usuario"));
}

function logout() {
  localStorage.removeItem("usuario");
  window.location.href = "index.html";
}


function atualizarNavbar() {
  const usuario = getUsuario();
  const navLogin = document.getElementById("navLogin");
  const navUsuario = document.getElementById("navUsuario");
  const navNome = document.getElementById("navNome");
  const navAnunciar = document.getElementById("navAnunciar");

  if (usuario) {
    if (navLogin) navLogin.style.display = "none";
    if (navUsuario) navUsuario.style.display = "flex";
    if (navNome) navNome.textContent = usuario.nome.split(" ")[0];
    if (navAnunciar && usuario.tipo_usuario === "proprietario") {
      navAnunciar.style.display = "inline";
    }
  } else {
    if (navLogin) navLogin.style.display = "inline";
    if (navUsuario) navUsuario.style.display = "none";
  }
}

document.addEventListener("DOMContentLoaded", atualizarNavbar);


const cadastroForm = document.getElementById("cadastroForm");
if (cadastroForm) {
  cadastroForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value.trim();
    const tipo_usuario = document.getElementById("tipo_usuario").value;

    if (nome.length < 3) {
      alert("Nome deve ter pelo menos 3 caracteres!");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert("E-mail inválido!");
      return;
    }
    if (senha.length < 6) {
      alert("Senha deve ter pelo menos 6 caracteres!");
      return;
    }

    const res = await fetch(API + "/cadastro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, email, senha, tipo_usuario })
    });
    const data = await res.json();
    alert(data.mensagem || data.erro);
    if (data.mensagem) window.location.href = "login.html";
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
    salvarUsuario(data.usuario);
    alert("Login realizado!");
    window.location.href = "index.html";
  });
}


async function carregarImoveis() {
  const grid = document.getElementById("imoveis-grid");
  if (!grid) return;
  const res = await fetch(API + "/imoveis");
  const imoveis = await res.json();
  if (imoveis.length === 0) {
    grid.innerHTML = "<p style='color:#64748b'>Nenhum imóvel cadastrado ainda.</p>";
    return;
  }
  grid.innerHTML = imoveis.map(i => `
    <article class="card">
      <img src="${i.foto_url || 'https://via.placeholder.com/500x300'}" alt="${i.titulo}" class="card-img">
      <div class="card-content">
        <span class="tag ${i.tipo === 'corp' ? 'tag-corp' : 'tag-res'}">${i.tipo === 'corp' ? 'CORPORATIVO' : 'RESIDENCIAL'}</span>
        <h4>${i.titulo}</h4>
        <p class="location">${i.localizacao}</p>
        <p class="card-price">R$ ${parseFloat(i.preco).toFixed(2)} <small>/ noite</small></p>
        <button class="btn-search" style="margin-top:10px;width:100%" onclick="reservar(${i.id})">Reservar</button>
      </div>
    </article>
  `).join("");
}

async function reservar(imovel_id) {
  const usuario = getUsuario();
  if (!usuario) {
    alert("Faça login para reservar!");
    window.location.href = "login.html";
    return;
  }

  const checkinInput = prompt("Data de check-in (DD-MM-AAAA):");
  const checkoutInput = prompt("Data de check-out (DD-MM-AAAA):");
  if (!checkinInput || !checkoutInput) return;

  const regexData = /^\d{2}-\d{2}-\d{4}$/;
  if (!regexData.test(checkinInput) || !regexData.test(checkoutInput)) {
    alert("Formato de data inválido! Use DD-MM-AAAA");
    return;
  }

  function converterData(data) {
    const [dia, mes, ano] = data.split("-");
    return `${ano}-${mes}-${dia}`;
  }

  const checkin = converterData(checkinInput);
  const checkout = converterData(checkoutInput);

  if (new Date(checkin) >= new Date(checkout)) {
    alert("A data de check-out deve ser após o check-in!");
    return;
  }

  const res = await fetch(API + "/reservas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imovel_id, cliente_id: usuario.id, checkin, checkout })
  });
  const data = await res.json();
  if (data.mensagem) {
    alert(`Reserva realizada! Total: R$ ${parseFloat(data.valor_total).toFixed(2)}`);
  } else {
    alert(data.erro);
  }
}

document.addEventListener("DOMContentLoaded", carregarImoveis);


async function carregarUsuarios() {
  const tbody = document.getElementById("usuarios-tbody");
  if (!tbody) return;
  const res = await fetch(API + "/usuarios");
  const usuarios = await res.json();
  tbody.innerHTML = usuarios.map(u => `
    <tr>
      <td><input type="checkbox" value="${u.id}"></td>
      <td>${u.id}</td>
      <td>${u.nome}</td>
      <td>${u.email}</td>
      <td>${u.tipo_usuario === 'proprietario' ? 'Proprietário' : 'Cliente'}</td>
      <td>
        <button class="btn-edit" onclick="editarUsuario(${u.id}, '${u.nome}', '${u.email}')">Editar</button>
        <button class="btn-delete" onclick="excluirUsuario(${u.id})">Excluir</button>
      </td>
    </tr>
  `).join("");
}

async function excluirUsuario(id) {
  const usuarioLogado = getUsuario();
  if (usuarioLogado && usuarioLogado.id === id) {
    alert("Você não pode excluir sua própria conta!");
    return;
  }
  if (!confirm("Deseja excluir este usuário?")) return;
  await fetch(API + "/usuarios/" + id, { method: "DELETE" });
  carregarUsuarios();
}

async function editarUsuario(id, nome, email) {
  const novoNome = prompt("Novo nome:", nome);
  const novoEmail = prompt("Novo email:", email);
  const novaSenha = prompt("Nova senha (deixe em branco para não alterar):");
  if (!novoNome || !novoEmail) return;
  await fetch(API + "/usuarios/" + id, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome: novoNome, email: novoEmail, senha: novaSenha })
  });
  alert("Usuário atualizado!");
  carregarUsuarios();
}

document.addEventListener("DOMContentLoaded", carregarUsuarios);


const anunciarForm = document.getElementById("anunciarForm");
if (anunciarForm) {
  anunciarForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const usuario = getUsuario();

    const titulo = document.getElementById("titulo").value.trim();
    const localizacao = document.getElementById("localizacao").value.trim();
    const preco = document.getElementById("preco").value;
    const tipo = document.getElementById("tipo").value;
    const foto_url = document.getElementById("foto_url").value.trim();

    if (titulo.length < 5) {
      alert("Título deve ter pelo menos 5 caracteres!");
      return;
    }
    if (/^\d+$/.test(titulo)) {
      alert("Título não pode ser apenas números!");
      return;
    }
    if (localizacao.length < 5) {
      alert("Localização deve ter pelo menos 5 caracteres!");
      return;
    }
    if (/^\d+$/.test(localizacao)) {
      alert("Localização não pode ser apenas números!");
      return;
    }
    if (!foto_url) {
      alert("A foto é obrigatória!");
      return;
    }
    if (!foto_url.startsWith("http")) {
      alert("URL da foto inválida!");
      return;
    }

    const res = await fetch(API + "/imoveis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo, localizacao, preco, tipo, foto_url, proprietario_id: usuario.id })
    });
    const data = await res.json();
    alert(data.mensagem || data.erro);
    if (data.mensagem) window.location.href = "index.html";
  });
}


async function carregarReservas() {
  const tbody = document.getElementById("reservas-tbody");
  if (!tbody) return;
  const usuario = getUsuario();
  if (!usuario) {
    window.location.href = "login.html";
    return;
  }
  const res = await fetch(API + "/reservas/" + usuario.id);
  const reservas = await res.json();
  if (reservas.length === 0) {
    tbody.innerHTML = "<tr><td colspan='6'>Nenhuma reserva encontrada.</td></tr>";
    return;
  }
  tbody.innerHTML = reservas.map(r => `
    <tr>
      <td>${r.id}</td>
      <td>${r.titulo}</td>
      <td>${r.localizacao}</td>
      <td>${r.checkin}</td>
      <td>${r.checkout}</td>
      <td>R$ ${parseFloat(r.valor_total).toFixed(2)}</td>
      <td><button class="btn-delete" onclick="cancelarReserva(${r.id})">Cancelar</button></td>
    </tr>
  `).join("");
}

async function cancelarReserva(id) {
  if (!confirm("Deseja cancelar esta reserva?")) return;
  await fetch(API + "/reservas/" + id, { method: "DELETE" });
  carregarReservas();
}

document.addEventListener("DOMContentLoaded", carregarReservas);