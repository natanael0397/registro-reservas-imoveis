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


let todosImoveis = [];

async function carregarImoveis() {
  const grid = document.getElementById("imoveis-grid");
  if (!grid) return;
  const res = await fetch(API + "/imoveis");
  todosImoveis = await res.json();
  renderizarImoveis(todosImoveis);
}

function renderizarImoveis(imoveis) {
  const grid = document.getElementById("imoveis-grid");
  if (!grid) return;
  if (imoveis.length === 0) {
    grid.innerHTML = "<p style='color:#64748b'>Nenhum imóvel encontrado.</p>";
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

function buscarImoveis() {
  const filtroLocal = document.getElementById("filtroLocal");
  const filtroTipo = document.getElementById("filtroTipo");
  if (!filtroLocal || !filtroTipo) return;

  const local = filtroLocal.value.trim().toLowerCase();
  const tipo = filtroTipo.value;

  const filtrados = todosImoveis.filter(i => {
    const matchLocal = local === "" || i.localizacao.toLowerCase().includes(local);
    const matchTipo = tipo === "" || i.tipo === tipo;
    return matchLocal && matchTipo;
  });

  renderizarImoveis(filtrados);
}

document.addEventListener("DOMContentLoaded", carregarImoveis);


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
    window.location.href = "reservas.html";
  } else {
    alert(data.erro);
  }
}


async function carregarUsuarios() {
  const tbody = document.getElementById("usuarios-tbody");
  if (!tbody) return;
  const usuarioLogado = getUsuario();
  const res = await fetch(API + "/usuarios");
  const usuarios = await res.json();
  tbody.innerHTML = usuarios.map(u => {
    const ehProprioUsuario = usuarioLogado && usuarioLogado.id === u.id;
    return `
      <tr>
        <td><input type="checkbox" value="${u.id}"></td>
        <td>${u.id}</td>
        <td>${u.nome}</td>
        <td>${u.email}</td>
        <td>${u.tipo_usuario === 'proprietario' ? 'Proprietário' : 'Cliente'}</td>
        <td>
          ${ehProprioUsuario
            ? `<button class="btn-edit" onclick="editarUsuario(${u.id}, '${u.nome}', '${u.email}')">Editar</button>
               <button class="btn-delete" onclick="excluirUsuario(${u.id})">Excluir</button>`
            : `<span style="color:#94a3b8; font-size:0.85rem;">sem permissão</span>`
          }
        </td>
      </tr>
    `;
  }).join("");
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

  const usuarioLogado = getUsuario();
  if (usuarioLogado && usuarioLogado.id === id) {
    usuarioLogado.nome = novoNome;
    usuarioLogado.email = novoEmail;
    salvarUsuario(usuarioLogado);
    atualizarNavbar();
  }

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
  try {
    const res = await fetch(API + "/reservas/" + usuario.id);
    const reservas = await res.json();
    if (reservas.length === 0) {
      tbody.innerHTML = "<tr><td colspan='7'>Nenhuma reserva encontrada.</td></tr>";
      return;
    }
    tbody.innerHTML = reservas.map(r => `
      <tr>
        <td>${r.id}</td>
        <td>${r.titulo}</td>
        <td>${r.localizacao}</td>
        <td>${r.checkin.split('T')[0].split('-').reverse().join('-')}</td>
        <td>${r.checkout.split('T')[0].split('-').reverse().join('-')}</td>
        <td>R$ ${parseFloat(r.valor_total).toFixed(2)}</td>
        <td>
          <button class="btn-edit" onclick="editarReserva(${r.id})">Editar</button>
          <button class="btn-delete" onclick="cancelarReserva(${r.id})">Cancelar</button>
        </td>
      </tr>
    `).join("");
  } catch (err) {
    tbody.innerHTML = "<tr><td colspan='7'>Erro ao carregar reservas.</td></tr>";
  }
}

async function editarReserva(id) {
  const checkinInput = prompt("Nova data de check-in (DD-MM-AAAA):");
  const checkoutInput = prompt("Nova data de check-out (DD-MM-AAAA):");
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

  const res = await fetch(API + "/reservas/" + id, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ checkin, checkout })
  });
  const data = await res.json();
  if (data.mensagem) {
    alert(`Reserva atualizada! Novo total: R$ ${parseFloat(data.valor_total).toFixed(2)}`);
    carregarReservas();
  } else {
    alert(data.erro);
  }
}

async function cancelarReserva(id) {
  if (!confirm("Deseja cancelar esta reserva?")) return;
  await fetch(API + "/reservas/" + id, { method: "DELETE" });
  carregarReservas();
}

document.addEventListener("DOMContentLoaded", carregarReservas);


async function carregarImoveisTabela() {
  const tbody = document.getElementById("imoveis-tbody");
  if (!tbody) return;
  const usuarioLogado = getUsuario();
  const res = await fetch(API + "/imoveis");
  const imoveis = await res.json();
  if (imoveis.length === 0) {
    tbody.innerHTML = "<tr><td colspan='6'>Nenhum imóvel cadastrado.</td></tr>";
    return;
  }
  tbody.innerHTML = imoveis.map(i => {
    const ehDono = usuarioLogado && usuarioLogado.id === i.proprietario_id;
    return `
      <tr>
        <td>${i.id}</td>
        <td>${i.titulo}</td>
        <td>${i.localizacao}</td>
        <td>${i.tipo === 'corp' ? 'Corporativo' : 'Residencial'}</td>
        <td>R$ ${parseFloat(i.preco).toFixed(2)}</td>
        <td>
          ${ehDono
            ? `<button class="btn-edit" onclick="editarImovel(${i.id}, '${i.titulo}', '${i.localizacao}', ${i.preco}, '${i.tipo}', '${i.foto_url}')">Editar</button>
               <button class="btn-delete" onclick="excluirImovel(${i.id})">Excluir</button>`
            : `<span style="color:#94a3b8; font-size:0.85rem;">sem permissão</span>`
          }
        </td>
      </tr>
    `;
  }).join("");
}

async function excluirImovel(id) {
  if (!confirm("Deseja excluir este imóvel?")) return;
  await fetch(API + "/imoveis/" + id, { method: "DELETE" });
  carregarImoveisTabela();
}

async function editarImovel(id, titulo, localizacao, preco, tipo, foto_url) {
  const novoTitulo = prompt("Título:", titulo);
  const novaLocalizacao = prompt("Localização:", localizacao);
  const novoPreco = prompt("Preço por noite:", preco);
  const novaFoto = prompt("URL da foto:", foto_url);
  if (!novoTitulo || !novaLocalizacao || !novoPreco) return;

  if (novoTitulo.length < 5) { alert("Título deve ter pelo menos 5 caracteres!"); return; }
  if (/^\d+$/.test(novoTitulo)) { alert("Título não pode ser apenas números!"); return; }
  if (novaLocalizacao.length < 5) { alert("Localização deve ter pelo menos 5 caracteres!"); return; }
  if (!novaFoto || !novaFoto.startsWith("http")) { alert("URL da foto inválida!"); return; }

  await fetch(API + "/imoveis/" + id, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ titulo: novoTitulo, localizacao: novaLocalizacao, preco: novoPreco, tipo, foto_url: novaFoto })
  });
  alert("Imóvel atualizado!");
  carregarImoveisTabela();
}

document.addEventListener("DOMContentLoaded", carregarImoveisTabela);