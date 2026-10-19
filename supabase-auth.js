
(function () {
  "use strict";

  var COMPANY_ID = "8c1e2a7d-6b4f-4a9c-8d3e-1f7a5b2c9d60";
  var KEY = "adega-estoque-v1";
  var CACHE_KEY = "sge-shared-company-v1";

  var client = null;
  var activeUser = null;
  var loadedUserId = null;
  var activationPromise = null;
  var savingPromise = Promise.resolve();
  var realtimeChannel = null;
  var lastRemoteData = null;
  var readyResolved = false;
  var resolveReady;

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

  function emptyData() {
    return {
      products: [],
      log: [],
      cashDays: {}
    };
  }

  function normalizeData(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return emptyData();
    }

    return {
      products: Array.isArray(data.products) ? data.products : [],
      log: Array.isArray(data.log) ? data.log : [],
      cashDays:
        data.cashDays &&
        typeof data.cashDays === "object" &&
        !Array.isArray(data.cashDays)
          ? data.cashDays
          : {}
    };
  }

  function getLocalData() {
    try {
      var saved = localStorage.getItem(KEY);
      return saved ? normalizeData(JSON.parse(saved)) : emptyData();
    } catch (error) {
      console.error("Erro ao ler os dados locais:", error);
      return emptyData();
    }
  }

  function setLocalData(data) {
    localStorage.setItem(KEY, JSON.stringify(normalizeData(data)));
  }

  function showMessage(message, isError) {
    var element = document.getElementById("sge-auth-message");
    if (!element) return;

    element.textContent = message;
    element.style.color = isError ? "#b91c1c" : "#166534";
  }

  function stopRealtime() {
    if (realtimeChannel && client) {
      client.removeChannel(realtimeChannel);
      realtimeChannel = null;
    }

    lastRemoteData = null;
  }

  function startRealtime() {
    stopRealtime();

    if (!client || !activeUser) return;

    realtimeChannel = client
      .channel("sge-shared-" + COMPANY_ID)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "sge_shared_data",
          filter: "company_id=eq." + COMPANY_ID
        },
        function (payload) {
          if (
            !activeUser ||
            loadedUserId !== activeUser.id ||
            !payload.new ||
            !payload.new.data
          ) {
            return;
          }

          var remoteData = normalizeData(payload.new.data);
          var remoteJSON = JSON.stringify(remoteData);

          // Ignora dados que já estão aplicados nesta aba.
          if (remoteJSON === lastRemoteData) return;

          lastRemoteData = remoteJSON;

          try {
            setLocalData(remoteData);

            // Atualiza a interface sem fazer uma nova gravação no banco.
            if (typeof window.SGEApplyRemoteData === "function") {
              window.SGEApplyRemoteData(remoteData);
            } else {
              console.warn(
                "Crie window.SGEApplyRemoteData no script.js para atualizar a tela."
              );
            }
          } catch (error) {
            console.error(
              "Erro ao aplicar atualização recebida:",
              error
            );
          }
        }
      )
      .subscribe(function (status) {
        if (status === "SUBSCRIBED") {
          console.log("SGE: sincronização em tempo real conectada.");
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error(
            "SGE: falha na conexão em tempo real:",
            status
          );
        }
      });
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

      #sge-auth-card h2 { margin-top: 0; }
      #sge-auth-card p { line-height: 1.5; }

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
        opacity: .65;
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

        <p>Entre com sua conta autorizada para acessar o estoque compartilhado.</p>

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

          <button id="sge-auth-submit" type="submit">Entrar</button>
          <button id="sge-auth-toggle" type="button">Criar uma conta</button>
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
        showMessage("A autenticação não está disponível.", true);
        return;
      }

      submit.disabled = true;
      toggle.disabled = true;

      var email = document.getElementById("sge-auth-email").value.trim();
      var password = document.getElementById("sge-auth-password").value;

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
            "Conta criada. Confirme seu e-mail e depois entre. " +
            "A conta ainda precisará ser autorizada para acessar o estoque.",
            false
          );
        } else if (result.data.session) {
          await activateUser(result.data.session);
        } else {
          showMessage("Não foi possível iniciar a sessão.", true);
        }
      } catch (error) {
        showMessage(
          error.message || "Erro durante a autenticação.",
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

    if (loadedUserId === user.id && activeUser) {
      finishReady();
      return;
    }

    if (activationPromise) {
      await activationPromise;

      if (loadedUserId === user.id && activeUser) return;
    }

    activationPromise = loadUserData(user);

    try {
      await activationPromise;
    } finally {
      activationPromise = null;
    }
  }

  async function loadUserData(user) {
    var screen = document.getElementById("sge-auth-screen");

    try {
      showMessage("Verificando autorização...", false);

      var membership = await client
        .from("sge_company_members")
        .select("user_id, role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (membership.error) throw membership.error;

      if (!membership.data) {
        stopRealtime();
        activeUser = null;
        loadedUserId = null;

        if (screen) screen.style.display = "flex";

        showMessage(
          "Esta conta ainda não tem autorização para acessar o estoque. " +
          "Peça ao administrador do SGE para liberar seu acesso.",
          true
        );

        return;
      }

      var result = await client
        .from("sge_shared_data")
        .select("data")
        .eq("company_id", COMPANY_ID)
        .maybeSingle();

      if (result.error) throw result.error;

      var sharedData;

      if (result.data) {
        sharedData = normalizeData(result.data.data);
      } else {
        sharedData = emptyData();

        var inserted = await client
          .from("sge_shared_data")
          .insert({
            company_id: COMPANY_ID,
            data: sharedData
          });

        if (inserted.error) throw inserted.error;
      }

      setLocalData(sharedData);
      localStorage.setItem(CACHE_KEY, COMPANY_ID);

      activeUser = user;
      loadedUserId = user.id;
      lastRemoteData = JSON.stringify(sharedData);

      if (typeof window.SGEApplyRemoteData === "function") {
        window.SGEApplyRemoteData(sharedData);
      }

      startRealtime();

      if (screen) screen.style.display = "none";

      showUserBar(user.email);
      finishReady();
    } catch (error) {
      stopRealtime();
      activeUser = null;
      loadedUserId = null;

      if (screen) screen.style.display = "flex";

      showMessage(
        "Não foi possível carregar o SGE: " +
        (error.message || "erro desconhecido") +
        ". Confira as tabelas, as permissões e a conexão do Supabase.",
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

        stopRealtime();
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

    savingPromise = savingPromise.catch(function () {}).then(async function () {
      if (!activeUser || loadedUserId !== activeUser.id) return;

      var data = getLocalData();
      var serialized = JSON.stringify(data);

      var result = await client
        .from("sge_shared_data")
        .upsert({
          company_id: COMPANY_ID,
          data: data,
          updated_at: new Date().toISOString()
        }, {
          onConflict: "company_id"
        });

      if (result.error) {
        console.error("Erro ao sincronizar SGE:", result.error.message);
        throw result.error;
      }

      lastRemoteData = serialized;
    });

    return savingPromise;
  }

  async function start() {
    createInterface();

    if (
      !window.supabase ||
      typeof window.supabase.createClient !== "function"
    ) {
      showMessage(
        "A biblioteca do Supabase não foi carregada. Confira o index.html.",
        true
      );
      return;
    }

    if (!window.SGE_SUPABASE_URL || !window.SGE_SUPABASE_ANON_KEY) {
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
        Promise.resolve().then(async function () {
          if (session) {
            try {
              await activateUser(session);
            } catch (error) {
              console.error("Erro ao ativar conta:", error.message);
            }
          } else if (event === "SIGNED_OUT") {
            stopRealtime();
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
