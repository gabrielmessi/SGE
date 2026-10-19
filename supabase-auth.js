
(function () {
  "use strict";

  var KEY = "adega-estoque-v1";
  var OWNER_KEY = "adega-estoque-owner-v1";

  var client = null;
  var activeUser = null;
  var loadedUserId = null;
  var loadingUserId = null;
  var readyResolved = false;
  var resolveReady;
  var activationPromise = null;

  window.SGECloud = {
    ready: new Promise(function (resolve) {
      resolveReady = resolve;
    }),
    syncNow: syncNow
  };

  function finishReady() {
    if (!readyResolved) {
      readyResolved = true;
      resolveReady();
    }
  }

  function getLocalData() {
    try {
      var saved = localStorage.getItem(KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error("Erro ao ler os dados locais:", error);
      return null;
    }
  }

  function setLocalData(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  function emptyData() {
    return {
      products: [],
      log: [],
      cashDays: {}
    };
  }

  function showMessage(message, isError) {
    var element = document.getElementById("sge-auth-message");
    if (!element) return;

    element.textContent = message;
    element.style.color = isError ? "#b91c1c" : "#166534";
  }

  function createInterface() {
    if (document.getElementById("sge-auth-screen")) return;

    var style = document.createElement("style");

    style.textContent = `
      #sge-auth-screen {
        position: fixed;
        inset: 0;
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        background: #111827;
        font-family: Arial, sans-serif;
      }

      #sge-auth-card {
        width: 100%;
        max-width: 380px;
        box-sizing: border-box;
        padding: 28px;
        border-radius: 14px;
        background: white;
        color: #111827;
        box-shadow: 0 12px 40px #0004;
      }

      #sge-auth-card h2 {
        margin-top: 0;
      }

      #sge-auth-card p {
        line-height: 1.5;
      }

      #sge-auth-card input {
        display: block;
        box-sizing: border-box;
        width: 100%;
        margin: 8px 0 14px;
        padding: 12px;
        border: 1px solid #d1d5db;
        border-radius: 7px;
        font-size: 15px;
      }

      #sge-auth-card button {
        width: 100%;
        margin-top: 8px;
        padding: 12px;
        border: 0;
        border-radius: 7px;
        cursor: pointer;
        font-size: 15px;
      }

      #sge-auth-card button:disabled {
        cursor: wait;
        opacity: 0.65;
      }

      #sge-auth-submit {
        background: #2563eb;
        color: white;
      }

      #sge-auth-toggle {
        background: #e5e7eb;
        color: #111827;
      }

      #sge-auth-message {
        overflow-wrap: anywhere;
        font-size: 14px;
      }

      #sge-user-bar {
        position: fixed;
        right: 12px;
        bottom: 12px;
        z-index: 99998;
        display: flex;
        align-items: center;
        gap: 10px;
        max-width: calc(100% - 24px);
        padding: 9px 12px;
        border-radius: 9px;
        background: #111827;
        color: white;
        font: 12px Arial, sans-serif;
      }

      #sge-user-bar button {
        padding: 6px 9px;
        border: 0;
        border-radius: 5px;
        cursor: pointer;
      }
    `;

    document.head.appendChild(style);

    var screen = document.createElement("div");
    screen.id = "sge-auth-screen";

    screen.innerHTML = `
      <div id="sge-auth-card">
        <h2 id="sge-auth-title">Entrar no SGE</h2>

        <p>
          Entre com sua conta para acessar os dados do estoque.
        </p>

        <form id="sge-auth-form">
          <label for="sge-auth-email">E-mail</label>

          <input
            id="sge-auth-email"
            type="email"
            autocomplete="email"
            required
          >

          <label for="sge-auth-password">Senha</label>

          <input
            id="sge-auth-password"
            type="password"
            autocomplete="current-password"
            minlength="6"
            required
          >

          <button id="sge-auth-submit" type="submit">
            Entrar
          </button>

          <button id="sge-auth-toggle" type="button">
            Criar uma conta
          </button>
        </form>

        <p id="sge-auth-message" role="status"></p>
      </div>
    `;

    document.body.appendChild(screen);

    var registering = false;
    var form = document.getElementById("sge-auth-form");
    var toggle = document.getElementById("sge-auth-toggle");
    var submit = document.getElementById("sge-auth-submit");

    toggle.addEventListener("click", function () {
      registering = !registering;

      document.getElementById("sge-auth-title").textContent =
        registering ? "Criar conta no SGE" : "Entrar no SGE";

      submit.textContent = registering ? "Cadastrar" : "Entrar";

      toggle.textContent = registering
        ? "Já tenho uma conta"
        : "Criar uma conta";

      document.getElementById("sge-auth-password").autocomplete =
        registering ? "new-password" : "current-password";

      showMessage("", false);
    });

    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      if (!client) {
        showMessage("O sistema de autenticação não está disponível.", true);
        return;
      }

      submit.disabled = true;
      toggle.disabled = true;

      var email = document
        .getElementById("sge-auth-email")
        .value.trim();

      var password = document
        .getElementById("sge-auth-password")
        .value;

      try {
        var result = registering
          ? await client.auth.signUp({
              email: email,
              password: password
            })
          : await client.auth.signInWithPassword({
              email: email,
              password: password
            });

        if (result.error) throw result.error;

        if (registering && !result.data.session) {
          showMessage(
            "Conta criada. Confira seu e-mail para confirmar o cadastro. " +
            "Depois, volte aqui e entre com sua conta.",
            false
          );
        } else if (result.data.session) {
          await activateUser(result.data.session);
        } else {
          showMessage(
            "Não foi possível iniciar a sessão. Verifique o cadastro.",
            true
          );
        }
      } catch (error) {
        showMessage(
          error.message || "Ocorreu um erro na autenticação.",
          true
        );
      } finally {
        submit.disabled = false;
        toggle.disabled = false;
      }
    });
  }

  async function activateUser(session) {
    if (!session || !session.user) return;

    var user = session.user;

    if (loadedUserId === user.id) {
      finishReady();
      return;
    }

    if (loadingUserId === user.id && activationPromise) {
      await activationPromise;
      return;
    }

    loadingUserId = user.id;

    activationPromise = loadUserData(user);

    try {
      await activationPromise;
    } finally {
      loadingUserId = null;
      activationPromise = null;
    }
  }

  async function loadUserData(user) {
    try {
      activeUser = user;

      var result = await client
        .from("sge_data")
        .select("data")
        .eq("user_id", user.id)
        .maybeSingle();

      if (result.error) throw result.error;

      if (result.data) {
        // Os dados da nuvem são a fonte principal desta conta.
        setLocalData(result.data.data);
      } else {
        var localData = getLocalData();
        var localOwnerId = localStorage.getItem(OWNER_KEY);

        // Não reutilizar dados identificados como pertencentes
        // a outra conta neste navegador.
        if (localOwnerId && localOwnerId !== user.id) {
          localData = null;
        }

        if (localData) {
          var importLocal = window.confirm(
            "Esta conta ainda não tem dados na nuvem.\n\n" +
            "Deseja importar os dados salvos neste navegador?\n\n" +
            "OK = importar os dados locais.\n" +
            "Cancelar = começar com um estoque vazio."
          );

          if (!importLocal) {
            localData = emptyData();
          }
        } else {
          localData = emptyData();
        }

        setLocalData(localData);

        var inserted = await client
          .from("sge_data")
          .insert({
            user_id: user.id,
            data: localData
          });

        if (inserted.error) throw inserted.error;
      }

      // Registra a conta proprietária dos dados locais.
      localStorage.setItem(OWNER_KEY, user.id);

      loadedUserId = user.id;

      var screen = document.getElementById("sge-auth-screen");

      if (screen) {
        screen.style.display = "none";
      }

      showUserBar(user.email);
      finishReady();
    } catch (error) {
      activeUser = null;
      loadedUserId = null;

      showMessage(
        "Erro ao carregar os dados: " +
        (error.message || "erro desconhecido") +
        ". Verifique a configuração, a conexão e as permissões do Supabase.",
        true
      );

      throw error;
    }
  }

  function showUserBar(email) {
    var oldBar = document.getElementById("sge-user-bar");

    if (oldBar) oldBar.remove();

    var bar = document.createElement("div");
    bar.id = "sge-user-bar";

    var account = document.createElement("span");
    account.textContent = email || "Conta conectada";

    var logout = document.createElement("button");
    logout.textContent = "Sair";

    logout.addEventListener("click", async function () {
      logout.disabled = true;

      try {
        var result = await client.auth.signOut();

        if (result.error) throw result.error;

        activeUser = null;
        loadedUserId = null;

        window.location.reload();
      } catch (error) {
        logout.disabled = false;

        window.alert(
          "Não foi possível sair: " +
          (error.message || "erro desconhecido")
        );
      }
    });

    bar.appendChild(account);
    bar.appendChild(logout);
    document.body.appendChild(bar);
  }

  async function syncNow() {
    if (!client || !activeUser || loadedUserId !== activeUser.id) {
      return;
    }

    var data = getLocalData();

    if (!data) return;

    // Impede sincronizar dados locais marcados para outra conta.
    var ownerId = localStorage.getItem(OWNER_KEY);

    if (ownerId && ownerId !== activeUser.id) {
      throw new Error(
        "Os dados locais não pertencem à conta atualmente conectada."
      );
    }

    var result = await client
      .from("sge_data")
      .upsert({
        user_id: activeUser.id,
        data: data,
        updated_at: new Date().toISOString()
      }, {
        onConflict: "user_id"
      });

    if (result.error) {
      console.error(
        "Erro ao sincronizar SGE:",
        result.error.message
      );

      throw result.error;
    }
  }

  async function start() {
    createInterface();

    if (
      !window.supabase ||
      typeof window.supabase.createClient !== "function"
    ) {
      showMessage(
        "A biblioteca do Supabase não foi carregada. " +
        "Confira o index.html e sua conexão.",
        true
      );
      return;
    }

    if (
      !window.SGE_SUPABASE_URL ||
      !window.SGE_SUPABASE_ANON_KEY
    ) {
      showMessage(
        "Faltam as configurações do Supabase em supabase-config.js.",
        true
      );
      return;
    }

    try {
      client = window.supabase.createClient(
        window.SGE_SUPABASE_URL,
        window.SGE_SUPABASE_ANON_KEY
      );

      client.auth.onAuthStateChange(function (event, session) {
        // Não executar operações de banco diretamente no callback.
        Promise.resolve().then(async function () {
          if (session) {
            try {
              await activateUser(session);
            } catch (error) {
              console.error(
                "Erro ao ativar a conta:",
                error.message
              );
            }
          } else if (event === "SIGNED_OUT") {
            activeUser = null;
            loadedUserId = null;
          }
        });
      });

      var result = await client.auth.getSession();

      if (result.error) throw result.error;

      if (result.data.session) {
        await activateUser(result.data.session);
      }
    } catch (error) {
      showMessage(
        "Não foi possível iniciar o SGE: " +
        (error.message || "erro desconhecido"),
        true
      );
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
