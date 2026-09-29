# TECHBANK — Sistema de Gerenciamento Bancário

Sistema desenvolvido em **JavaScript + Node.js** com **Next.js (App Router)** e **Tailwind CSS** para a atividade do TechBank.

A solução conta com interface moderna inspirada no padrão **shadcn/ui**, tema escuro por padrão, botões de ação com destaque em **laranja vibrante**, ícones da biblioteca **`iconoir-react`**, e conformidade estrita com todos os requisitos de negócio (RN01 a RN10).

---

## 📋 Mapeamento dos Requisitos de Negócio

| Requisito | Descrição | Onde está implementado |
| :--- | :--- | :--- |
| **RN01** | Uma conta deve possuir titular e saldo. | `ContaBancaria.js` (validação no construtor exigindo titular válido e saldo). |
| **RN02** | O saldo inicial deve ser informado na criação da conta. | `ContaBancaria.js` (rejeita criação sem saldo ou com saldo negativo) e Modal de Abertura. |
| **RN03** | O sistema deve permitir consultar o saldo. | Método `consultarSaldo()` na classe, rotas de API e exibição em tempo real na interface com opção de ocultar/exibir. |
| **RN04** | O sistema deve permitir realizar depósitos. | Método `depositar(valor, descricao)`, rota `/api/contas/[id]/deposito` e painel de depósito. |
| **RN05** | Somente valores maiores que zero podem ser depositados. | Validação estrita `valor > 0` antes de alterar o saldo. Rejeita zero, negativos ou dados não numéricos. |
| **RN06** | O sistema deve permitir realizar saques. | Método `sacar(valor, descricao)`, rota `/api/contas/[id]/saque` e painel de saque. |
| **RN07** | Somente valores maiores que zero podem ser sacados. | Validação estrita `valor > 0` antes do saque. Rejeita zero ou valores negativos. |
| **RN08** | Não é permitido sacar valor superior ao saldo disponível. | Checagem `valor <= this.saldo`. Caso o valor supere o saldo, a transação é bloqueada com mensagem explícita. |
| **RN09** | Operações inválidas não podem alterar o saldo da conta. | Todas as operações são atômicas e com validações prévias; se qualquer regra falhar, o saldo é mantido 100% íntegro. |
| **RN10** | A solução deve ser organizada considerando futuras ampliações. | Arquitetura modular separada em camadas: Domínio (`models/ContaBancaria.js`), Serviço (`services/BancoService.js`), Rotas de API (`/api/contas/...`) e Componentes reutilizáveis de interface (`components/ui/...`). Suporte nativo já incluído para transferência entre contas. |

---

## 🏛️ Estrutura do Projeto

```text
techbank/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── contas/
│   │   │       ├── route.js                    # GET (listar) e POST (criar conta)
│   │   │       ├── [id]/
│   │   │       │   ├── route.js                # GET (consultar saldo e detalhes)
│   │   │       │   ├── deposito/route.js       # POST (realizar depósito - RN04/RN05)
│   │   │       │   └── saque/route.js          # POST (realizar saque - RN06/RN07/RN08)
│   │   │       ├── transferir/route.js         # POST (transferência entre contas - RN10)
│   │   │       └── reset/route.js              # POST (restaurar dados de teste)
│   │   ├── globals.css                         # Tema escuro padrão, estilos e glow laranja
│   │   ├── layout.js                           # Root Layout do Next.js
│   │   └── page.js                             # Dashboard interativo do TechBank
│   ├── components/
│   │   └── ui/
│   │       ├── alert.js                        # Alertas de sucesso e erro de regras
│   │       ├── badge.js                        # Tags de status e modalidades
│   │       ├── button.js                       # Botões estilo shadcn com destaque laranja
│   │       ├── card.js                         # Cards escuros com backdrop blur
│   │       ├── dialog.js                       # Modal para criação de novas contas
│   │       └── input.js                        # Inputs com foco laranja
│   └── lib/
│       ├── models/
│       │   └── ContaBancaria.js                # Entidade de domínio (regras RN01 a RN09)
│       ├── services/
│       │   └── BancoService.js                 # Camada de serviço em memória (RN10)
│       └── utils.js                            # Formatação BRL e utilitários
├── test/
│   └── regrasDeNegocio.test.mjs                # Suíte de testes automatizados (RN01 - RN10)
└── package.json
```

---

## 🚀 Como Executar o Projeto

### 1. Pré-requisitos
- Node.js instalado (v18, v20 ou v22+)
- npm

### 2. Instalação das dependências
Caso esteja configurando em uma máquina nova:
```bash
npm install
```

### 3. Rodar os testes automatizados das Regras de Negócio
```bash
npm test
```
*Executa a suíte de testes com o test runner nativo do Node.js (`node --test`), validando 100% das 10 regras.*

### 4. Iniciar o servidor de desenvolvimento
```bash
npm run dev
```
Abra o navegador em [http://localhost:3000](http://localhost:3000).

---

## 🎨 Destaques de Design e Usabilidade

- **Tema Escuro Nativo**: Interface desenhada diretamente para modo escuro permanente com paleta de slate profundo (`#080c14` e `#0f172a`).
- **Botões em Destaque Laranja**: Botões de ação primária com gradiente vibrante (`#ff6a00` a `#f59e0b`) e efeito de iluminação sutil (*glow*).
- **Ícones Iconoir**: Biblioteca `iconoir-react` em todos os elementos visuais.
- **Painel de Auditoria ao Vivo**: Permite testar visualmente as regras de negócio diretamente na tela com um clique, comprovando o bloqueio de operações inválidas sem alteração de saldo.
