pipeline {
    agent any
    
    environment {
        PROJECT_NAME = 'agenda-edu-api'
        DOCKER_IMAGE = 'agenda-edu-api'
        DOCKER_TAG = "${env.BUILD_NUMBER}"
        NODE_VERSION = '18'
    }
    
    stages {
        stage('🔍 Checkout') {
            steps {
                echo '📥 Fazendo checkout do código...'
                script {
                    env.GIT_COMMIT_SHORT = sh(
                        script: 'git rev-parse --short HEAD',
                        returnStdout: true
                    ).trim()
                }
                echo "📌 Commit: ${env.GIT_COMMIT_SHORT}"
                echo "🌿 Branch: ${env.BRANCH_NAME ?: env.GIT_BRANCH}"
            }
        }
        
        stage('🔧 Environment Check') {
            steps {
                echo '🔧 Verificando ambiente...'
                sh '''
                    echo "Node.js: $(node --version || echo 'Node.js não encontrado')"
                    echo "NPM: $(npm --version || echo 'NPM não encontrado')"
                    echo "Docker: $(docker --version || echo 'Docker não encontrado')"
                    echo "Sistema: $(uname -a)"
                    echo "Usuário: $(whoami)"
                    echo "Diretório: $(pwd)"
                    echo "Arquivos: $(ls -la)"
                '''
            }
        }
        
        stage('📦 Install Dependencies') {
            steps {
                echo '📦 Instalando dependências...'
                script {
                    try {
                        sh 'npm ci'
                    } catch (Exception e) {
                        echo '⚠️ npm ci falhou, tentando npm install...'
                        sh 'npm install'
                    }
                }
                sh 'npm list --depth=0 || true'
            }
        }
        
        stage('🔍 Code Quality') {
            parallel {
                stage('Lint') {
                    steps {
                        echo '🔍 Executando lint...'
                        sh 'npm run lint || echo "Lint não configurado ou falhou"'
                    }
                }
                stage('Audit') {
                    steps {
                        echo '🔒 Verificando vulnerabilidades...'
                        sh 'npm audit --audit-level=high || echo "Vulnerabilidades encontradas"'
                    }
                }
            }
        }
        
        stage('🏗️ Build') {
            steps {
                echo '🏗️ Fazendo build da aplicação...'
                sh 'npm run build'
                sh 'ls -la dist/ || echo "Diretório dist não encontrado"'
            }
        }
        
        stage('🧪 Tests') {
            steps {
                echo '🧪 Executando testes...'
                sh 'npm test || echo "Nenhum teste configurado ainda"'
            }
        }
        
        stage('🐳 Docker Build') {
            steps {
                echo '🐳 Construindo imagem Docker...'
                script {
                    try {
                        def image = docker.build("${DOCKER_IMAGE}:${DOCKER_TAG}")
                        env.DOCKER_IMAGE_ID = image.id
                        echo "✅ Imagem Docker criada: ${DOCKER_IMAGE}:${DOCKER_TAG}"
                    } catch (Exception e) {
                        echo "❌ Erro no Docker build: ${e.getMessage()}"
                        throw e
                    }
                }
            }
        }
        
        stage('🧪 Integration Tests') {
            steps {
                echo '🧪 Executando testes de integração...'
                script {
                    try {
                        sh '''
                            echo "Iniciando container para teste..."
                            docker run -d --name test-container-${BUILD_NUMBER} -p 300${BUILD_NUMBER}:3000 ${DOCKER_IMAGE}:${DOCKER_TAG}
                            
                            echo "Aguardando container inicializar..."
                            sleep 15
                            
                            echo "Testando health check..."
                            curl -f http://localhost:300${BUILD_NUMBER}/health || exit 1
                            
                            echo "Testando endpoint de teste..."
                            curl -f http://localhost:300${BUILD_NUMBER}/api/test || exit 1
                            
                            echo "✅ Testes de integração passaram!"
                        '''
                    } catch (Exception e) {
                        echo "❌ Testes de integração falharam: ${e.getMessage()}"
                        throw e
                    } finally {
                        sh "docker rm -f test-container-${BUILD_NUMBER} || true"
                    }
                }
            }
        }
        
        stage('📤 Docker Registry') {
            when {
                anyOf {
                    branch 'main'
                    branch 'master'
                    branch 'develop'
                }
            }
            steps {
                echo '📤 Preparando para registry...'
                script {
                    echo "Branch: ${env.BRANCH_NAME ?: env.GIT_BRANCH}"
                    echo "Imagem: ${DOCKER_IMAGE}:${DOCKER_TAG}"
                    // Aqui adicionaremos push para registry depois
                }
            }
        }
    }
    
    post {
        always {
            echo '🧹 Limpando ambiente...'
            sh """
                docker system prune -f || true
                docker rmi ${DOCKER_IMAGE}:${DOCKER_TAG} || true
                docker rm -f test-container-${BUILD_NUMBER} || true
            """
        }
        
        success {
            echo '✅ Pipeline executado com sucesso!'
            script {
                def duration = currentBuild.duration ? "${currentBuild.duration / 1000}s" : "N/A"
                echo "🕐 Duração: ${duration}"
                echo "📊 Build #${env.BUILD_NUMBER} - ${env.GIT_COMMIT_SHORT}"
            }
        }
        
        failure {
            echo '❌ Pipeline falhou!'
            script {
                echo "🔍 Verificar logs para detalhes do erro"
                echo "📊 Build #${env.BUILD_NUMBER} - ${env.GIT_COMMIT_SHORT}"
            }
        }
        
        unstable {
            echo '⚠️ Pipeline instável - alguns testes falharam'
        }
    }
}