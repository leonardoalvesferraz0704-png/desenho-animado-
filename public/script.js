const CLIENT_ID = "224330911887-omff5nuenpsb9d4p6187mjcqdi37kptl.apps.googleusercontent.com";

const formulario = document.getElementById("formulario");
const campoNumero = document.getElementById("numero");
const area = document.getElementById("desenho");
const mensagem = document.getElementById("mensagem");
const botaoBaixar = document.getElementById("baixar");

let idToken = "";
let svgAtual = "";

function aoLogar(resposta) {
  idToken = resposta.credential;
  mensagem.textContent = "Login realizado. Escolha um número e clique em Desenhar.";
}

window.addEventListener("load", () => {
  if (!window.google || !google.accounts) {
    mensagem.textContent = "Não foi possível carregar o login do Google.";
    return;
  }
  google.accounts.id.initialize({
    client_id: CLIENT_ID,
    callback: aoLogar,
  });
  google.accounts.id.renderButton(document.getElementById("botao-google"), {
    theme: "outline",
    size: "large",
  });
});

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  mensagem.textContent = "";

  if (!idToken) {
    mensagem.textContent = "Entre com o Google antes de gerar o desenho.";
    return;
  }

  const numero = Number(campoNumero.value);

  try {
    const resposta = await fetch("/api/desenho", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + idToken,
      },
      body: JSON.stringify({ numero }),
    });

    if (resposta.status === 400) {
      mensagem.textContent = "Erro 400: digite um número inteiro entre 1 e 100.";
      return;
    }
    if (resposta.status === 401) {
      mensagem.textContent = "Erro 401: sessão inválida ou expirada. Entre com o Google novamente.";
      return;
    }
    if (!resposta.ok) {
      mensagem.textContent = "Erro inesperado (" + resposta.status + ").";
      return;
    }

    svgAtual = await resposta.text();
    area.innerHTML = svgAtual;
    botaoBaixar.hidden = false;
  } catch (erro) {
    mensagem.textContent = "Falha de rede ao chamar o servidor.";
  }
});

botaoBaixar.addEventListener("click", () => {
  const arquivo = new Blob([svgAtual], { type: "image/svg+xml" });
  const url = URL.createObjectURL(arquivo);
  const link = document.createElement("a");
  link.href = url;
  link.download = "exemplo.svg";
  link.click();
  URL.revokeObjectURL(url);
});