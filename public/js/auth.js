// js/auth.js

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const cadastroForm = document.getElementById('cadastro-form');
    const showCadastroLink = document.getElementById('show-cadastro');
    const showLoginLink = document.getElementById('show-login');

    // Alternância entre formulários
    if (showCadastroLink) {
        showCadastroLink.addEventListener('click', function(e) {
            e.preventDefault();
            loginForm.style.display = 'none';
            cadastroForm.style.display = 'block';
        });
    }

    if (showLoginLink) {
        showLoginLink.addEventListener('click', function(e) {
            e.preventDefault();
            cadastroForm.style.display = 'none';
            loginForm.style.display = 'block';
        });
    }

    // Login
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const formData = new FormData(loginForm);

            try {
                const response = await fetch('../php/login.php', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();

                if (response.ok) {
                    alert(result.mensagem);
                    window.location.href = 'index.html';
                } else {
                    alert(result.mensagem || 'Erro no login');
                }
            } catch (error) {
                console.error('Erro no login:', error);
                alert('Erro de comunicação. Tente novamente.');
            }
        });
    }

    // Cadastro
    if (cadastroForm) {
        cadastroForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const formData = new FormData(cadastroForm);
            const senha = formData.get('senha');
            const confirmaSenha = formData.get('confirma_senha');

            if (senha !== confirmaSenha) {
                alert('As senhas não coincidem!');
                return;
            }

            try {
                const response = await fetch('../php/cadastro.php', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();

                if (response.ok) {
                    alert(result.mensagem);
                    // Voltar para o formulário de login
                    cadastroForm.style.display = 'none';
                    loginForm.style.display = 'block';
                    cadastroForm.reset();
                } else {
                    alert(result.mensagem || 'Erro no cadastro');
                }
            } catch (error) {
                console.error('Erro no cadastro:', error);
                alert('Erro de comunicação. Tente novamente.');
            }
        });
    }
});
