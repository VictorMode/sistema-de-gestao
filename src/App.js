import React, { useState, useEffect, createContext, useContext } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { Home, Clock, Package, Factory, DollarSign, Users, UserPlus, LogOut, Settings, Sparkle, PlusCircle, MinusCircle, List, DollarSignIcon, Edit, FileText, TrendingUp, TrendingDown, CreditCard, Truck, Bell } from 'lucide-react';

// Seu objeto de configuração Firebase (substituído pelo que você forneceu)
const firebaseConfig = {
  apiKey: "AIzaSyC6UpQgsR6c6m6ngpB0u8dXS_C-gvYnrx0",
  authDomain: "sistemaopasteleiro.firebaseapp.com",
  projectId: "sistemaopasteleiro",
  storageBucket: "sistemaopasteleiro.firebasestorage.app",
  messagingSenderId: "309025164972",
  appId: "1:309025164972:web:b287aca780f8f292525909"
};

// Inicialize o Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const firebaseAuth = getAuth(app);


// Contexto para o Firebase e informações do usuário
const AppContext = createContext(null);

// Componente de Login com autenticação Firebase
const Login = ({ onLoginSuccess }) => {
  const { auth, db } = useContext(AppContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async () => {
    if (!auth || !db) {
      setMessage('Sistema não inicializado. Tente recarregar a página.');
      return;
    }
    setMessage(''); // Clear previous messages

    try {
      // Tenta fazer login com email e senha
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged no componente App cuidará do resto
      onLoginSuccess(); // Signal login attempt success
    } catch (error) {
      console.error("Erro durante o login:", error);
      // Melhorar mensagens de erro para o usuário
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setMessage('Email ou senha inválidos.');
      } else if (error.code === 'auth/invalid-email') {
        setMessage('Formato de email inválido.');
      } else {
        setMessage(`Erro ao fazer login: ${error.message}`);
      }
    }
  };

  // Esta funcionalidade seria apenas para ADMIN criar o primeiro usuário ou usuários
  // Em um ambiente de produção, a criação de usuários seria no painel Admin, não na tela de Login.
  const handleRegisterAdmin = async () => {
    if (!auth || !db) {
      setMessage('Sistema não inicializado.');
      return;
    }
    setMessage('');

    try {
      // Cria o usuário no Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // Define a função (role) do usuário no Firestore
      const appId = firebaseConfig.appId; // Use a appId do seu firebaseConfig
      const userDocRef = doc(db, `artifacts/${appId}/public/data/users`, uid);
      await setDoc(userDocRef, {
        email: email,
        role: 'admin', // Define o primeiro usuário como admin
        createdAt: serverTimestamp(),
      });

      setMessage('Usuário administrador registrado com sucesso! Faça login.');
      setEmail('');
      setPassword('');

    } catch (error) {
      console.error("Erro ao registrar usuário:", error);
      if (error.code === 'auth/email-already-in-use') {
        setMessage('Este email já está em uso.');
      } else if (error.code === 'auth/weak-password') {
        setMessage('A senha deve ter no mínimo 6 caracteres.');
      } else {
        setMessage(`Erro ao registrar: ${error.message}`);
      }
    }
  };


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">Acesso ao Sistema</h2>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
            Email:
          </label>
          <input
            type="email"
            id="email"
            className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
            Senha:
          </label>
          <input
            type="password"
            id="password"
            className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
          />
        </div>
        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-300 ease-in-out transform hover:scale-105"
        >
          Entrar
        </button>
        {message && <p className="mt-4 text-center text-sm text-red-500">{message}</p>}

        <p className="mt-6 text-center text-gray-600 text-sm">
          Atenção: Se este é o primeiro acesso, você pode registrar um usuário admin aqui.
          <br/>
          <button
            onClick={handleRegisterAdmin}
            className="mt-2 text-indigo-600 hover:text-indigo-800 font-bold"
          >
            Registrar Novo Admin (somente 1x)
          </button>
        </p>
      </div>
    </div>
  );
};

// Modal de Edição de Ponto
const EditPointModal = ({ show, onClose, point, onSave, collaborators }) => {
  const [editedType, setEditedType] = useState(point?.type || 'entrada');
  const [editedTimestamp, setEditedTimestamp] = useState(point?.timestamp?.toDate().toISOString().slice(0, 16) || '');
  const [selectedCollabId, setSelectedCollabId] = useState(point?.userId || '');

  useEffect(() => {
    if (point) {
      setEditedType(point.type);
      setEditedTimestamp(point.timestamp.toDate().toISOString().slice(0, 16));
      setSelectedCollabId(point.userId);
    }
  }, [point]);

  const handleSave = () => {
    onSave({
      ...point,
      type: editedType,
      timestamp: new Date(editedTimestamp),
      userId: selectedCollabId, // Garante que o userId seja atualizado se o ponto for movido para outro colaborador
    });
    onClose();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 className="text-2xl font-bold mb-4 text-gray-800">Editar Registro de Ponto</h3>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="editCollab">Colaborador:</label>
          <select
            id="editCollab"
            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedCollabId}
            onChange={(e) => setSelectedCollabId(e.target.value)}
            disabled={true} // O ID do colaborador não deve ser editável diretamente aqui, apenas o ponto
          >
            {collaborators.map(collab => (
              <option key={collab.id} value={collab.id}>{collab.name}</option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="editType">Tipo:</label>
          <select
            id="editType"
            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={editedType}
            onChange={(e) => setEditedType(e.target.value)}
          >
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
          </select>
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="editTimestamp">Data e Hora:</label>
          <input
            type="datetime-local"
            id="editTimestamp"
            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={editedTimestamp}
            onChange={(e) => setEditedTimestamp(e.target.value)}
          />
        </div>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition duration-300"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
          >
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
};


// Componente Controle de Ponto
const Ponto = () => {
  const { db, userId, userRole, currentUserPaymentType } = useContext(AppContext);
  const [points, setPoints] = useState([]);
  const [message, setMessage] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPoint, setEditingPoint] = useState(null);
  const [collaborators, setCollaborators] = useState([]);

  // Carregar lista de colaboradores (para admin view)
  useEffect(() => {
    if (!db || userRole !== 'admin') return;
    const appId = firebaseConfig.appId;
    const collaboratorsCollectionRef = collection(db, `artifacts/${appId}/public/data/collaborators`);
    const unsubscribe = onSnapshot(collaboratorsCollectionRef, (snapshot) => {
      const collabsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCollaborators(collabsList);
    }, (error) => {
      console.error("Erro ao carregar colaboradores:", error);
    });
    return () => unsubscribe();
  }, [db, userRole]);


  // Listener para os registros de ponto
  useEffect(() => {
    if (!db || !userId) return;

    const appId = firebaseConfig.appId;
    let pointsCollectionRef;

    if (userRole === 'admin') {
      pointsCollectionRef = collection(db, `artifacts/${appId}/public/data/all_user_points`);
    } else {
      pointsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/pontos`);
    }

    const q = query(pointsCollectionRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pointsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      pointsList.sort((a, b) => a.timestamp.toDate() - b.timestamp.toDate());
      setPoints(pointsList);
    }, (error) => {
      console.error("Erro ao carregar pontos:", error);
      setMessage("Erro ao carregar registros de ponto.");
    });

    return () => unsubscribe();
  }, [db, userId, userRole]);

  const registerPoint = async (type) => {
    if (!db || !userId) {
      setMessage('Usuário não autenticado ou banco de dados não disponível.');
      return;
    }
    if (currentUserPaymentType === 'producao') {
      setMessage('O registro de ponto não se aplica a colaboradores por produção.');
      return;
    }

    try {
      const appId = firebaseConfig.appId;
      const userPointsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/pontos`);
      const allPointsCollectionRef = collection(db, `artifacts/${appId}/public/data/all_user_points`);

      // 1. Adiciona o ponto na coleção privada do usuário
      const newPointRef = await addDoc(userPointsCollectionRef, {
        type: type,
        timestamp: serverTimestamp(),
        userId: userId,
      });

      // 2. Adiciona uma cópia na coleção pública para admins
      await addDoc(allPointsCollectionRef, {
        userId: userId,
        pointId: newPointRef.id,
        type: type,
        timestamp: serverTimestamp(),
        userName: collaborators.find(c => c.id === userId)?.name || 'Desconhecido',
      });

      setMessage(`Ponto de ${type} registrado com sucesso!`);
    } catch (error) {
      console.error(`Erro ao registrar ponto de ${type}:`, error);
      setMessage(`Erro ao registrar ponto: ${error.message}`);
    }
  };

  const handleEditClick = (point) => {
    setEditingPoint(point);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (editedPoint) => {
    if (!db || !editedPoint) return;

    try {
      const appId = firebaseConfig.appId;

      // Atualiza o ponto na coleção pública (all_user_points)
      const allPointsDocRef = doc(db, `artifacts/${appId}/public/data/all_user_points`, editedPoint.id);
      await updateDoc(allPointsDocRef, {
        type: editedPoint.type,
        timestamp: editedPoint.timestamp,
      });

      // Atualiza o ponto na coleção privada do usuário (usando originalPointId)
      const userPointsDocRef = doc(db, `artifacts/${appId}/users/${editedPoint.userId}/pontos`, editedPoint.pointId);
      await updateDoc(userPointsDocRef, {
        type: editedPoint.type,
        timestamp: editedPoint.timestamp,
      });

      setMessage('Ponto atualizado com sucesso!');
    } catch (error) {
      console.error("Erro ao salvar edição do ponto:", error);
      setMessage(`Erro ao salvar edição: ${error.message}`);
    } finally {
      setShowEditModal(false);
      setEditingPoint(null);
    }
  };

  const handleExportPdf = () => {
    if (typeof window.html2canvas === 'undefined' || typeof window.jspdf === 'undefined') { // Usando window.html2canvas e window.jspdf
      setMessage('Bibliotecas de PDF (html2canvas, jspdf) não carregadas. Verifique o console.');
      console.error('Para exportar PDF, certifique-se de que html2canvas e jspdf estão carregados via tags script no seu index.html.');
      return;
    }

    const input = document.getElementById('points-table');
    if (!input) {
      setMessage('Tabela de pontos não encontrada para exportação.');
      return;
    }

    window.html2canvas(input, { // Usando window.html2canvas
      scale: 2
    }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new window.jspdf.jsPDF('p', 'mm', 'a4'); // Usando window.jspdf.jsPDF
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`historico_ponto_${new Date().toLocaleDateString('pt-BR')}.pdf`);
      setMessage('Histórico de ponto exportado para PDF!');
    }).catch(error => {
      console.error("Erro ao gerar PDF:", error);
      setMessage(`Erro ao exportar PDF: ${error.message}`);
    });
  };


  const calculateDailyHours = () => {
    if (userRole === 'admin' || currentUserPaymentType === 'producao') return "N/A (Admin View / Por Produção)";

    const today = new Date();
    const todayPoints = points.filter(p => {
      const pointDate = p.timestamp.toDate();
      return pointDate.getDate() === today.getDate() &&
             pointDate.getMonth() === today.getMonth() &&
             pointDate.getFullYear() === today.getFullYear();
    });

    let totalMinutes = 0;
    let lastEntry = null;

    todayPoints.forEach(p => {
      if (p.type === 'entrada') {
        lastEntry = p.timestamp.toDate();
      } else if (p.type === 'saida' && lastEntry) {
        totalMinutes += (p.timestamp.toDate() - lastEntry) / (1000 * 60);
        lastEntry = null;
      }
    });

    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);

    const targetDailyMinutes = 8 * 60;
    const diffMinutes = totalMinutes - targetDailyMinutes;
    let extraHours = 0;
    let missingHours = 0;

    if (diffMinutes > 0) {
      extraHours = Math.floor(diffMinutes / 60);
      const extraMinutes = Math.round(diffMinutes % 60);
      return `Total: ${hours}h ${minutes}m. Extra hoje: ${extraHours}h ${extraMinutes}m.`;
    } else if (diffMinutes < 0) {
      missingHours = Math.floor(Math.abs(diffMinutes) / 60);
      const missingMinutes = Math.round(Math.abs(diffMinutes) % 60);
      return `Total: ${hours}h ${minutes}m. Faltas hoje: ${missingHours}h ${missingMinutes}m.`;
    } else {
      return `Total: ${hours}h ${minutes}m. (Horas normais atingidas hoje)`;
    }
  };


  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Controle de Ponto</h2>
      <p className="text-gray-600">Registre sua entrada e saída. O sistema calculará suas horas trabalhadas, horas extras e faltas.</p>

      {userRole !== 'admin' && currentUserPaymentType !== 'producao' && (
        <div className="mt-6 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 justify-center">
          <button
            onClick={() => registerPoint('entrada')}
            className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 transform hover:scale-105"
          >
            <PlusCircle size={20} className="mr-2" /> Registrar Entrada
          </button>
          <button
            onClick={() => registerPoint('saida')}
            className="flex items-center justify-center bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 transform hover:scale-105"
          >
            <MinusCircle size={20} className="mr-2" /> Registrar Saída
          </button>
        </div>
      )}
      {userRole !== 'admin' && currentUserPaymentType === 'producao' && (
        <p className="mt-4 text-center text-orange-600 font-semibold">
          Você está cadastrado como colaborador por produção. O registro de ponto não se aplica a você.
        </p>
      )}

      {message && <p className="mt-4 text-center text-sm text-blue-500">{message}</p>}

      <div className="mt-8 p-4 border border-gray-200 rounded-lg bg-gray-50">
        <h3 className="text-xl font-medium mb-3 text-gray-700">
          {userRole === 'admin' ? 'Todos os Registros de Ponto' : 'Seus Registros de Ponto'}
        </h3>
        {userRole === 'admin' && (
          <button
            onClick={handleExportPdf}
            className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 mb-4"
          >
            <FileText size={18} className="mr-2" /> Exportar Histórico para PDF
          </button>
        )}
        {points.length > 0 ? (
          <div className="overflow-x-auto">
            <table id="points-table" className="min-w-full bg-white rounded-lg shadow-md">
              <thead>
                <tr className="bg-gray-200 text-gray-700 uppercase text-sm leading-normal">
                  {userRole === 'admin' && <th className="py-3 px-6 text-left">Colaborador</th>}
                  <th className="py-3 px-6 text-left">Tipo</th>
                  <th className="py-3 px-6 text-left">Data e Hora</th>
                  {userRole === 'admin' && <th className="py-3 px-6 text-center">Ações</th>}
                </tr>
              </thead>
              <tbody className="text-gray-600 text-sm font-light">
                {points.map(p => (
                  <tr key={p.id} className="border-b border-gray-200 hover:bg-gray-100">
                    {userRole === 'admin' && (
                      <td className="py-3 px-6 text-left whitespace-nowrap">
                        {collaborators.find(c => c.id === p.userId)?.name || `ID: ${p.userId}`}
                      </td>
                    )}
                    <td className="py-3 px-6 text-left whitespace-nowrap">
                      <span className={`font-semibold ${p.type === 'entrada' ? 'text-green-700' : 'text-red-700'}`}>
                        {p.type === 'entrada' ? 'Entrada' : 'Saída'}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-left whitespace-nowrap">
                      {p.timestamp.toDate().toLocaleString('pt-BR')}
                    </td>
                    {userRole === 'admin' && (
                      <td className="py-3 px-6 text-center">
                        <button
                          onClick={() => handleEditClick(p)}
                          className="text-blue-600 hover:text-blue-800 transition duration-300"
                          title="Editar Ponto"
                        >
                          <Edit size={18} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600">Nenhum registro de ponto encontrado.</p>
        )}
        {userRole !== 'admin' && currentUserPaymentType !== 'producao' && (
          <p className="mt-4 text-lg font-bold text-gray-800">
            Resumo Diário: {calculateDailyHours()}
          </p>
        )}
        <p className="mt-2 text-sm text-gray-500">
          (Cálculo de horas extras/faltas semanal e mais detalhado será implementado futuramente.)
        </p>
      </div>

      {showEditModal && (
        <EditPointModal
          show={showEditModal}
          onClose={() => setShowEditModal(false)}
          point={editingPoint}
          onSave={handleSaveEdit}
          collaborators={collaborators}
        />
      )}
    </div>
  );
};

// Componente Controle de Estoque
const Estoque = () => {
  const { db, userId, userRole } = useContext(AppContext);
  const [productName, setProductName] = useState('');
  const [productType, setProductType] = useState('');
  const [supplier, setSupplier] = useState('');
  const [cost, setCost] = useState('');
  const [quantity, setQuantity] = useState('');
  const [products, setProducts] = useState([]);
  const [stockMovementType, setStockMovementType] = useState('entrada');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [movementQuantity, setMovementQuantity] = useState('');
  const [stockLog, setStockLog] = useState([]);

  const [productDescription, setProductDescription] = useState('');
  const [reorderSuggestion, setReorderSuggestion] = useState('');
  const [loadingDescription, setLoadingDescription] = useState(false);
  const [loadingReorder, setLoadingReorder] = useState(false);
  const [apiMessage, setApiMessage] = useState('');
  const [message, setMessage] = useState('');

  // Listener para produtos
  useEffect(() => {
    if (!db) return;
    const appId = firebaseConfig.appId;
    const productsCollectionRef = collection(db, `artifacts/${appId}/public/data/products`);
    const unsubscribe = onSnapshot(productsCollectionRef, (snapshot) => {
      const productsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(productsList);
    }, (error) => {
      console.error("Erro ao carregar produtos:", error);
      setMessage("Erro ao carregar lista de produtos.");
    });
    return () => unsubscribe();
  }, [db]);

  // Listener para o log de estoque
  useEffect(() => {
    if (!db) return;
    const appId = firebaseConfig.appId;
    const logCollectionRef = collection(db, `artifacts/${appId}/public/data/stock_log`);
    const q = query(logCollectionRef);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      logList.sort((a, b) => b.timestamp.toDate() - a.timestamp.toDate());
      setStockLog(logList);
    }, (error) => {
      console.error("Erro ao carregar log de estoque:", error);
      setMessage("Erro ao carregar log de estoque.");
    });
    return () => unsubscribe();
  }, [db]);


  const addProduct = async () => {
    if (!db || !productName || !productType || !supplier || !cost || !quantity) {
      setMessage('Por favor, preencha todos os campos do produto.');
      return;
    }
    try {
      const appId = firebaseConfig.appId;
      const productsCollectionRef = collection(db, `artifacts/${appId}/public/data/products`);
      await addDoc(productsCollectionRef, {
        name: productName,
        type: productType,
        supplier: supplier,
        cost: parseFloat(cost),
        quantity: parseInt(quantity),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setMessage('Produto adicionado com sucesso!');
      setProductName('');
      setProductType('');
      setSupplier('');
      setCost('');
      setQuantity('');
    } catch (error) {
      console.error("Erro ao adicionar produto:", error);
      setMessage(`Erro ao adicionar produto: ${error.message}`);
    }
  };

  const handleStockMovement = async () => {
    if (!db || !selectedProductId || !movementQuantity || parseInt(movementQuantity) <= 0) {
      setMessage('Selecione um produto e insira uma quantidade válida para a movimentação.');
      return;
    }

    const productRef = doc(db, `artifacts/${firebaseConfig.appId}/public/data/products`, selectedProductId);
    const productSnap = await getDoc(productRef);

    if (!productSnap.exists()) {
      setMessage('Produto não encontrado.');
      return;
    }

    const currentQuantity = productSnap.data().quantity;
    let newQuantity = currentQuantity;
    const qty = parseInt(movementQuantity);

    if (stockMovementType === 'entrada') {
      newQuantity += qty;
    } else if (stockMovementType === 'saida') {
      if (currentQuantity < qty) {
        setMessage('Quantidade em estoque insuficiente para esta saída.');
        return;
      }
      newQuantity -= qty;
    }

    try {
      await updateDoc(productRef, {
        quantity: newQuantity,
        updatedAt: serverTimestamp(),
      });

      // Registrar no log de estoque
      const appId = firebaseConfig.appId;
      const logCollectionRef = collection(db, `artifacts/${appId}/public/data/stock_log`);
      await addDoc(logCollectionRef, {
        productId: selectedProductId,
        productName: productSnap.data().name,
        type: stockMovementType,
        quantity: qty,
        oldQuantity: currentQuantity,
        newQuantity: newQuantity,
        timestamp: serverTimestamp(),
        updatedBy: userId,
      });

      setMessage(`Estoque do produto ${productSnap.data().name} atualizado com sucesso!`);
      setMovementQuantity('');
      setSelectedProductId('');
    } catch (error) {
      console.error("Erro ao movimentar estoque:", error);
      setMessage(`Erro ao movimentar estoque: ${error.message}`);
    }
  };

  const generateProductDescription = async () => {
    if (!productName || !productType) {
      setApiMessage('Por favor, insira o nome e o tipo do produto para gerar a descrição.');
      return;
    }

    setLoadingDescription(true);
    setApiMessage('');
    setProductDescription('');

    try {
      const prompt = `Gere uma descrição criativa e concisa para um produto alimentício. Nome do produto: "${productName}", Tipo: "${productType}". A descrição deve ser atraente para vendas.`;
      let chatHistory = [];
      chatHistory.push({ role: "user", parts: [{ text: prompt }] });
      const payload = { contents: chatHistory };
      // A chave API será fornecida pelo ambiente Canvas, ou você usaria sua própria chave API Gemini aqui
      const apiKey = firebaseConfig.apiKey;
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (result.candidates && result.candidates.length > 0 &&
          result.candidates[0].content && result.candidates[0].content.parts &&
          result.candidates[0].content.parts.length > 0) {
        const text = result.candidates[0].content.parts[0].text;
        setProductDescription(text);
      } else {
        setApiMessage('Não foi possível gerar a descrição. Tente novamente.');
        console.error("Estrutura de resposta inesperada:", result);
      }
    } catch (error) {
      setApiMessage(`Erro ao gerar descrição: ${error.message}`);
      console.error("Erro na chamada da API Gemini:", error);
    } finally {
      setLoadingDescription(false);
    }
  };

  const suggestReorderPoint = async () => {
    if (!productName || !productType) {
      setApiMessage('Por favor, insira o nome e o tipo do produto para sugerir o ponto de reabastecimento.');
      return;
    }

    setLoadingReorder(true);
    setApiMessage('');
    setReorderSuggestion('');

    try {
      const prompt = `Para um produto alimentício chamado "${productName}" do tipo "${productType}", qual seria um ponto de reabastecimento (quantidade mínima em estoque para disparar um novo pedido) razoável, considerando que é um item perecível e de consumo contínuo? Forneça uma justificativa breve.`;
      let chatHistory = [];
      chatHistory.push({ role: "user", parts: [{ text: prompt }] });
      const payload = { contents: chatHistory };
      const apiKey = firebaseConfig.apiKey;
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (result.candidates && result.candidates.length > 0 &&
          result.candidates[0].content && result.candidates[0].content.parts &&
          result.candidates[0].content.parts.length > 0) {
        const text = result.candidates[0].content.parts[0].text;
        setReorderSuggestion(text);
      } else {
        setApiMessage('Não foi possível sugerir o ponto de reabastecimento. Tente novamente.');
        console.error("Estrutura de resposta inesperada:", result);
      }
    } catch (error) {
      setApiMessage(`Erro ao sugerir ponto de reabastecimento: ${error.message}`);
      console.error("Erro na chamada da API Gemini:", error);
    } finally {
      setLoadingReorder(false);
    }
  };

  const handleExportStockPdf = () => {
    if (typeof window.html2canvas === 'undefined' || typeof window.jspdf === 'undefined') { // Usando window.html2canvas e window.jspdf
      setMessage('Bibliotecas de PDF (html2canvas, jspdf) não carregadas. Verifique o console.');
      console.error('Para exportar PDF, certifique-se de que html2canvas e jspdf estão carregados via tags script no seu index.html.');
      return;
    }

    const input = document.getElementById('products-table');
    if (!input) {
      setMessage('Tabela de produtos não encontrada para exportação.');
      return;
    }

    window.html2canvas(input, { // Usando window.html2canvas
      scale: 2
    }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new window.jspdf.jsPDF('p', 'mm', 'a4'); // Usando window.jspdf.jsPDF
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`relatorio_estoque_${new Date().toLocaleDateString('pt-BR')}.pdf`);
      setMessage('Relatório de estoque exportado para PDF!');
    }).catch(error => {
      console.error("Erro ao gerar PDF:", error);
      setMessage(`Erro ao exportar PDF: ${error.message}`);
    });
  };


  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Controle de Estoque</h2>
      <p className="text-gray-600">Gerenciamento completo de produtos, fornecedores e movimentação de estoque.</p>

      {message && <p className="mt-4 text-center text-sm text-blue-500">{message}</p>}

      {/* Cadastro de Produtos */}
      <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
        <h3 className="text-xl font-medium mb-3 text-gray-700">Cadastrar Novo Produto</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="productName">Nome do Produto:</label>
            <input type="text" id="productName" className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500" value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="Ex: Farinha de Trigo" />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="productType">Tipo do Produto:</label>
            <input type="text" id="productType" className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500" value={productType} onChange={(e) => setProductType(e.target.value)} placeholder="Ex: Grãos, Laticínios" />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="supplier">Fornecedor:</label>
            <input type="text" id="supplier" className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500" value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Ex: Atacadão" />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="cost">Custo Unitário:</label>
            <input type="number" id="cost" className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="Ex: 50.00" step="0.01" />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="quantity">Quantidade Inicial:</label>
            <input type="number" id="quantity" className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Ex: 100" />
          </div>
        </div>
        <button onClick={addProduct} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-300">
          Adicionar Produto
        </button>
      </div>

      {/* Ferramentas Gemini */}
      <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
        <h3 className="text-xl font-medium mb-3 text-gray-700">Ferramentas Gemini ✨</h3>
        <p className="text-gray-600 mb-4">Utilize o nome e tipo do produto acima para gerar descrições e sugestões de reabastecimento.</p>
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 mb-4">
          <button
            onClick={generateProductDescription}
            className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-300 w-full sm:w-auto"
            disabled={loadingDescription}
          >
            {loadingDescription ? 'Gerando...' : (
              <>
                <Sparkle size={18} className="mr-2" /> Gerar Descrição
              </>
            )}
          </button>
          <button
            onClick={suggestReorderPoint}
            className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-300 w-full sm:w-auto"
            disabled={loadingReorder}
          >
            {loadingReorder ? 'Sugerindo...' : (
              <>
                <Sparkle size={18} className="mr-2" /> Sugerir Ponto de Reabastecimento
              </>
            )}
          </button>
        </div>

        {apiMessage && <p className="mt-3 text-sm text-red-500 text-center">{apiMessage}</p>}

        {productDescription && (
          <div className="mt-6 p-4 border border-blue-300 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">Descrição Gerada:</h4>
            <p className="text-blue-700">{productDescription}</p>
          </div>
        )}

        {reorderSuggestion && (
          <div className="mt-6 p-4 border border-green-300 bg-green-50 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">Sugestão de Ponto de Reabastecimento:</h4>
            <p className="text-green-700">{reorderSuggestion}</p>
          </div>
        )}
      </div>

      {/* Movimentação de Estoque */}
      <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
        <h3 className="text-xl font-medium mb-3 text-gray-700">Movimentar Estoque</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="selectProduct">Produto:</label>
            <select id="selectProduct" className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500" value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)}>
              <option value="">Selecione um produto</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} (Estoque: {p.quantity})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="movementQuantity">Quantidade:</label>
            <input type="number" id="movementQuantity" className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500" value={movementQuantity} onChange={(e) => setMovementQuantity(e.target.value)} placeholder="Quantidade" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-gray-700 text-sm font-bold mb-2">Tipo de Movimentação:</label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input type="radio" className="form-radio text-blue-600" name="stockMovementType" value="entrada" checked={stockMovementType === 'entrada'} onChange={() => setStockMovementType('entrada')} />
                <span className="ml-2 text-gray-700">Entrada</span>
              </label>
              <label className="inline-flex items-center">
                <input type="radio" className="form-radio text-red-600" name="stockMovementType" value="saida" checked={stockMovementType === 'saida'} onChange={() => setStockMovementType('saida')} />
                <span className="ml-2 text-gray-700">Saída</span>
              </label>
            </div>
          </div>
        </div>
        <button onClick={handleStockMovement} className="mt-4 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-300">
          Confirmar Movimentação
        </button>
      </div>

      {/* Lista de Produtos */}
      <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
        <h3 className="text-xl font-medium mb-3 text-gray-700">Produtos Cadastrados</h3>
        {userRole === 'admin' && (
          <button
            onClick={handleExportStockPdf}
            className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 mb-4"
          >
            <FileText size={18} className="mr-2" /> Gerar Relatório de Estoque (PDF)
          </button>
        )}
        {products.length > 0 ? (
          <div className="overflow-x-auto">
            <table id="products-table" className="min-w-full bg-white rounded-lg shadow-md">
              <thead>
                <tr className="bg-gray-200 text-gray-700 uppercase text-sm leading-normal">
                  <th className="py-3 px-6 text-left">Produto</th>
                  <th className="py-3 px-6 text-left">Tipo</th>
                  <th className="py-3 px-6 text-left">Fornecedor</th>
                  <th className="py-3 px-6 text-right">Custo</th>
                  <th className="py-3 px-6 text-right">Quantidade</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 text-sm font-light">
                {products.map(p => (
                  <tr key={p.id} className="border-b border-gray-200 hover:bg-gray-100">
                    <td className="py-3 px-6 text-left whitespace-nowrap">{p.name}</td>
                    <td className="py-3 px-6 text-left">{p.type}</td>
                    <td className="py-3 px-6 text-left">{p.supplier}</td>
                    <td className="py-3 px-6 text-right">R$ {p.cost.toFixed(2)}</td>
                    <td className="py-3 px-6 text-right font-bold">{p.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600">Nenhum produto cadastrado ainda.</p>
        )}
      </div>

      {/* Log de Movimentação de Estoque */}
      <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
        <h3 className="text-xl font-medium mb-3 text-gray-700">Log de Movimentação de Estoque</h3>
        {stockLog.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg shadow-md">
              <thead>
                <tr className="bg-gray-200 text-gray-700 uppercase text-sm leading-normal">
                  <th className="py-3 px-6 text-left">Data/Hora</th>
                  <th className="py-3 px-6 text-left">Produto</th>
                  <th className="py-3 px-6 text-left">Tipo</th>
                  <th className="py-3 px-6 text-right">Qtd.</th>
                  <th className="py-3 px-6 text-right">Qtd. Antiga</th>
                  <th className="py-3 px-6 text-right">Qtd. Nova</th>
                  <th className="py-3 px-6 text-left">Atualizado Por</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 text-sm font-light">
                {stockLog.map(log => (
                  <tr key={log.id} className="border-b border-gray-200 hover:bg-gray-100">
                    <td className="py-3 px-6 text-left whitespace-nowrap">{log.timestamp.toDate().toLocaleString('pt-BR')}</td>
                    <td className="py-3 px-6 text-left">{log.productName}</td>
                    <td className={`py-3 px-6 text-left font-semibold ${log.type === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>{log.type === 'entrada' ? 'Entrada' : 'Saída'}</td>
                    <td className="py-3 px-6 text-right">{log.quantity}</td>
                    <td className="py-3 px-6 text-right">{log.oldQuantity}</td>
                    <td className="py-3 px-6 text-right font-bold">{log.newQuantity}</td>
                    <td className="py-3 px-6 text-left">{log.updatedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600">Nenhuma movimentação de estoque registrada ainda.</p>
        )}
      </div>
    </div>
  );
};

// Componente Controle de Produção
const Producao = () => {
  const { db, userId } = useContext(AppContext);
  const [productName, setProductName] = useState('');
  const [productType, setProductType] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [quantity, setQuantity] = useState('');
  const [manufacturedProducts, setManufacturedProducts] = useState([]);
  const [productionMovementType, setProductionMovementType] = useState('entrada');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [movementQuantity, setMovementQuantity] = useState('');
  const [productionLog, setProductionLog] = useState([]);
  const [message, setMessage] = useState('');

  // Listener para produtos fabricados
  useEffect(() => {
    if (!db) return;
    const appId = firebaseConfig.appId;
    const productsCollectionRef = collection(db, `artifacts/${appId}/public/data/manufactured_products`);
    const unsubscribe = onSnapshot(productsCollectionRef, (snapshot) => {
      const productsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setManufacturedProducts(productsList);
    }, (error) => {
      console.error("Erro ao carregar produtos de produção:", error);
      setMessage("Erro ao carregar lista de produtos de produção.");
    });
    return () => unsubscribe();
  }, [db]);

  // Listener para o log de produção
  useEffect(() => {
    if (!db) return;
    const appId = firebaseConfig.appId;
    const logCollectionRef = collection(db, `artifacts/${appId}/public/data/production_log`);
    const q = query(logCollectionRef);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      logList.sort((a, b) => b.timestamp.toDate() - a.timestamp.toDate());
      setProductionLog(logList);
    }, (error) => {
      console.error("Erro ao carregar log de produção:", error);
      setMessage("Erro ao carregar log de produção.");
    });
    return () => unsubscribe();
  }, [db]);

  const addManufacturedProduct = async () => {
    if (!db || !productName || !productType || !unitCost || !quantity) {
      setMessage('Por favor, preencha todos os campos do produto de produção.');
      return;
    }
    try {
      const appId = firebaseConfig.appId;
      const productsCollectionRef = collection(db, `artifacts/${appId}/public/data/manufactured_products`);
      await addDoc(productsCollectionRef, {
        name: productName,
        type: productType,
        unitCost: parseFloat(unitCost),
        quantity: parseInt(quantity),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setMessage('Produto de produção adicionado com sucesso!');
      setProductName('');
      setProductType('');
      setUnitCost('');
      setQuantity('');
    } catch (error) {
      console.error("Erro ao adicionar produto de produção:", error);
      setMessage(`Erro ao adicionar produto de produção: ${error.message}`);
    }
  };

  const handleProductionMovement = async () => {
    if (!db || !selectedProductId || !movementQuantity || parseInt(movementQuantity) <= 0) {
      setMessage('Selecione um produto e insira uma quantidade válida para a movimentação de produção.');
      return;
    }

    const productRef = doc(db, `artifacts/${firebaseConfig.appId}/public/data/manufactured_products`, selectedProductId);
    const productSnap = await getDoc(productRef);

    if (!productSnap.exists()) {
      setMessage('Produto de produção não encontrado.');
      return;
    }

    const currentQuantity = productSnap.data().quantity;
    let newQuantity = currentQuantity;
    const qty = parseInt(movementQuantity);

    if (productionMovementType === 'entrada') {
      newQuantity += qty;
    } else if (productionMovementType === 'saida') {
      if (currentQuantity < qty) {
        setMessage('Quantidade em estoque de produção insuficiente para esta saída.');
        return;
      }
      newQuantity -= qty;
    }

    try {
      await updateDoc(productRef, {
        quantity: newQuantity,
        updatedAt: serverTimestamp(),
      });

      // Registrar no log de produção
      const appId = firebaseConfig.appId;
      const logCollectionRef = collection(db, `artifacts/${appId}/public/data/production_log`);
      await addDoc(logCollectionRef, {
        productId: selectedProductId,
        productName: productSnap.data().name,
        type: productionMovementType,
        quantity: qty,
        oldQuantity: currentQuantity,
        newQuantity: newQuantity,
        timestamp: serverTimestamp(),
        updatedBy: userId,
      });

      setMessage(`Estoque de produção do produto ${productSnap.data().name} atualizado com sucesso!`);
      setMovementQuantity('');
      setSelectedProductId('');
    } catch (error) {
      console.error("Erro ao movimentar estoque de produção:", error);
      setMessage(`Erro ao movimentar estoque de produção: ${error.message}`);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Controle de Produção</h2>
      <p className="text-gray-600">Gerenciamento de produtos fabricados internamente, como massas e outros insumos.</p>

      {message && <p className="mt-4 text-center text-sm text-blue-500">{message}</p>}

      {/* Cadastro de Produtos de Produção */}
      <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
        <h3 className="text-xl font-medium mb-3 text-gray-700">Cadastrar Novo Produto Fabricado</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="prodName">Nome do Produto:</label>
            <input type="text" id="prodName" className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500" value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="Ex: Massa de Pastel" />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="prodType">Tipo do Produto:</label>
            <input type="text" id="prodType" className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500" value={productType} onChange={(e) => setProductType(e.target.value)} placeholder="Ex: Massa, Doce" />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="unitCost">Custo por Unidade (produção):</label>
            <input type="number" id="unitCost" className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} placeholder="Ex: 2.50" step="0.01" />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="prodQuantity">Quantidade Inicial:</label>
            <input type="number" id="prodQuantity" className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Ex: 50" />
          </div>
        </div>
        <button onClick={addManufacturedProduct} className="mt-4 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-300">
          Adicionar Produto de Produção
        </button>
      </div>

      {/* Movimentação de Produção */}
      <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
        <h3 className="text-xl font-medium mb-3 text-gray-700">Movimentar Estoque de Produção</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="selectProdProduct">Produto Fabricado:</label>
            <select id="selectProdProduct" className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500" value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)}>
              <option value="">Selecione um produto</option>
              {manufacturedProducts.map(p => (
                <option key={p.id} value={p.id}>{p.name} (Estoque: {p.quantity})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="prodMovementQuantity">Quantidade:</label>
            <input type="number" id="prodMovementQuantity" className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500" value={movementQuantity} onChange={(e) => setMovementQuantity(e.target.value)} placeholder="Quantidade" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-gray-700 text-sm font-bold mb-2">Tipo de Movimentação:</label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input type="radio" className="form-radio text-blue-600" name="productionMovementType" value="entrada" checked={productionMovementType === 'entrada'} onChange={() => setProductionMovementType('entrada')} />
                <span className="ml-2 text-gray-700">Entrada (Produzido)</span>
              </label>
              <label className="inline-flex items-center">
                <input type="radio" className="form-radio text-red-600" name="productionMovementType" value="saida" checked={productionMovementType === 'saida'} onChange={() => setProductionMovementType('saida')} />
                <span className="ml-2 text-gray-700">Saída (Utilizado)</span>
              </label>
            </div>
          </div>
        </div>
        <button onClick={handleProductionMovement} className="mt-4 bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-300">
          Confirmar Movimentação de Produção
        </button>
      </div>

      {/* Lista de Produtos Fabricados */}
      <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
        <h3 className="text-xl font-medium mb-3 text-gray-700">Produtos Fabricados Cadastrados</h3>
        {manufacturedProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg shadow-md">
              <thead>
                <tr className="bg-gray-200 text-gray-700 uppercase text-sm leading-normal">
                  <th className="py-3 px-6 text-left">Produto</th>
                  <th className="py-3 px-6 text-left">Tipo</th>
                  <th className="py-3 px-6 text-right">Custo Unitário</th>
                  <th className="py-3 px-6 text-right">Quantidade</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 text-sm font-light">
                {manufacturedProducts.map(p => (
                  <tr key={p.id} className="border-b border-gray-200 hover:bg-gray-100">
                    <td className="py-3 px-6 text-left whitespace-nowrap">{p.name}</td>
                    <td className="py-3 px-6 text-left">{p.type}</td>
                    <td className="py-3 px-6 text-right">R$ {p.unitCost.toFixed(2)}</td>
                    <td className="py-3 px-6 text-right font-bold">{p.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600">Nenhum produto fabricado cadastrado ainda.</p>
        )}
      </div>

      {/* Log de Movimentação de Produção */}
      <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
        <h3 className="text-xl font-medium mb-3 text-gray-700">Log de Movimentação de Produção</h3>
        {productionLog.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg shadow-md">
              <thead>
                <tr className="bg-gray-200 text-gray-700 uppercase text-sm leading-normal">
                  <th className="py-3 px-6 text-left">Data/Hora</th>
                  <th className="py-3 px-6 text-left">Produto</th>
                  <th className="py-3 px-6 text-left">Tipo</th>
                  <th className="py-3 px-6 text-right">Qtd.</th>
                  <th className="py-3 px-6 text-right">Qtd. Antiga</th>
                  <th className="py-3 px-6 text-right">Qtd. Nova</th>
                  <th className="py-3 px-6 text-left">Atualizado Por</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 text-sm font-light">
                {productionLog.map(log => (
                  <tr key={log.id} className="border-b border-gray-200 hover:bg-gray-100">
                    <td className="py-3 px-6 text-left whitespace-nowrap">{log.timestamp.toDate().toLocaleString('pt-BR')}</td>
                    <td className="py-3 px-6 text-left">{log.productName}</td>
                    <td className={`py-3 px-6 text-left font-semibold ${log.type === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>{log.type === 'entrada' ? 'Produzido' : 'Utilizado'}</td>
                    <td className="py-3 px-6 text-right">{log.quantity}</td>
                    <td className="py-3 px-6 text-right">{log.oldQuantity}</td>
                    <td className="py-3 px-6 text-right font-bold">{log.newQuantity}</td>
                    <td className="py-3 px-6 text-left">{log.updatedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600">Nenhuma movimentação de produção registrada ainda.</p>
        )}
      </div>
    </div>
  );
};


// Componente Controle de Pagamento
const Pagamento = () => {
  const { db, userId } = useContext(AppContext);
  const [collaborators, setCollaborators] = useState([]);
  const [selectedCollaboratorId, setSelectedCollaboratorId] = useState('');
  const [paymentType, setPaymentType] = useState('mensal');
  const [productionProduct, setProductionProduct] = useState('');
  const [unitValue, setUnitValue] = useState('');
  const [message, setMessage] = useState('');
  const [manufacturedProducts, setManufacturedProducts] = useState([]);
  const [paymentReminders, setPaymentReminders] = useState([]);

  // Carregar lista de colaboradores
  useEffect(() => {
    if (!db) return;
    const appId = firebaseConfig.appId;
    const collaboratorsCollectionRef = collection(db, `artifacts/${appId}/public/data/collaborators`);
    const unsubscribe = onSnapshot(collaboratorsCollectionRef, (snapshot) => {
      const collabsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCollaborators(collabsList);
    }, (error) => {
      console.error("Erro ao carregar colaboradores para pagamento:", error);
      setMessage("Erro ao carregar lista de colaboradores.");
    });
    return () => unsubscribe();
  }, [db]);

  // Carregar produtos fabricados para pagamento por produção
  useEffect(() => {
    if (!db) return;
    const appId = firebaseConfig.appId;
    const productsCollectionRef = collection(db, `artifacts/${appId}/public/data/manufactured_products`);
    const unsubscribe = onSnapshot(productsCollectionRef, (snapshot) => {
      const productsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setManufacturedProducts(productsList);
    }, (error) => {
      console.error("Erro ao carregar produtos de produção para pagamento:", error);
    });
    return () => unsubscribe();
  }, [db]);

  // Lógica de Lembretes de Pagamento
  useEffect(() => {
    const today = new Date();
    const currentDayOfMonth = today.getDate();
    const currentDayOfWeek = today.getDay();

    const reminders = [];

    collaborators.forEach(collab => {
      if (collab.paymentConfig) {
        const config = collab.paymentConfig;
        let isDue = false;
        let dueMessage = '';

        switch (config.type) {
          case 'diario':
            isDue = true;
            dueMessage = `Pagamento diário de ${collab.name} (R$ ${collab.salary ? collab.salary.toFixed(2) : 'N/A'})`;
            break;
          case 'semanal':
            if (currentDayOfWeek === 1) {
              isDue = true;
              dueMessage = `Pagamento semanal de ${collab.name} (R$ ${collab.salary ? collab.salary.toFixed(2) : 'N/A'})`;
            }
            break;
          case 'quinzenal':
            if (currentDayOfMonth === 1 || currentDayOfMonth === 15) {
              isDue = true;
              dueMessage = `Pagamento quinzenal de ${collab.name} (R$ ${collab.salary ? (collab.salary / 2).toFixed(2) : 'N/A'})`;
            }
            break;
          case 'mensal':
            if (currentDayOfMonth === 1) {
              isDue = true;
              dueMessage = `Pagamento mensal de ${collab.name} (R$ ${collab.salary ? collab.salary.toFixed(2) : 'N/A'})`;
            }
            break;
          case 'producao':
            const product = manufacturedProducts.find(p => p.id === config.productionProduct);
            if (product && product.quantity > 0 && config.unitValue > 0) {
              isDue = true;
              const amount = product.quantity * config.unitValue;
              dueMessage = `Pagamento por produção para ${collab.name} (${product.quantity} unidades de ${product.name} - R$ ${amount.toFixed(2)})`;
            }
            break;
          default:
            break;
        }

        if (isDue) {
          reminders.push(dueMessage);
        }
      }
    });
    setPaymentReminders(reminders);
  }, [collaborators, manufacturedProducts]);


  const handlePaymentSetup = async () => {
    if (!db || !selectedCollaboratorId || !paymentType) {
      setMessage('Por favor, selecione um colaborador e um tipo de pagamento.');
      return;
    }

    let paymentDetails = {
      type: paymentType,
    };

    if (paymentType === 'producao') {
      if (!productionProduct || !unitValue || parseFloat(unitValue) <= 0) {
        setMessage('Para pagamento por produção, selecione o produto e informe um valor unitário válido.');
        return;
      }
      paymentDetails.productionProduct = productionProduct;
      paymentDetails.unitValue = parseFloat(unitValue);
    }

    try {
      const appId = firebaseConfig.appId;
      const collaboratorDocRef = doc(db, `artifacts/${appId}/public/data/collaborators`, selectedCollaboratorId);
      await updateDoc(collaboratorDocRef, {
        paymentConfig: paymentDetails,
        updatedAt: serverTimestamp(),
      });
      setMessage('Configuração de pagamento salva com sucesso!');
    } catch (error) {
      console.error("Erro ao configurar pagamento:", error);
      setMessage(`Erro ao configurar pagamento: ${error.message}`);
    }
  };

  const handleRegisterPayment = async () => {
    if (!db || !selectedCollaboratorId) {
      setMessage('Selecione um colaborador para registrar o pagamento.');
      return;
    }

    const selectedCollab = collaborators.find(c => c.id === selectedCollaboratorId);
    if (!selectedCollab || !selectedCollab.paymentConfig) {
      setMessage('Colaborador ou configuração de pagamento não encontrada.');
      return;
    }

    const config = selectedCollab.paymentConfig;
    let amountToPay = 0;
    let description = `Pagamento de ${config.type} para ${selectedCollab.name}`;
    let category = 'Salário';

    if (config.type === 'mensal' || config.type === 'diario' || config.type === 'semanal' || config.type === 'quinzenal') {
      if (selectedCollab.salary) {
        amountToPay = selectedCollab.salary;
        if (config.type === 'quinzenal') amountToPay = selectedCollab.salary / 2;
        description = `Pagamento de ${config.type} para ${selectedCollab.name}`;
      } else {
        setMessage('Salário do colaborador não definido para este tipo de pagamento.');
        return;
      }
    } else if (config.type === 'producao') {
      const product = manufacturedProducts.find(p => p.id === config.productionProduct);
      if (product && product.quantity > 0 && config.unitValue > 0) {
        amountToPay = product.quantity * config.unitValue;
        description = `Pagamento por produção (${product.quantity} unidades de ${product.name}) para ${selectedCollab.name}`;
        category = 'Pagamento Entregador';

        const appId = firebaseConfig.appId;
        const productRef = doc(db, `artifacts/${appId}/public/data/manufactured_products`, product.id);
        await updateDoc(productRef, {
          quantity: 0,
          updatedAt: serverTimestamp(),
        });
        setMessage(`Estoque de produção de ${product.name} zerado após pagamento.`);
      } else {
        setMessage('Nenhuma produção disponível para pagamento ou produto não encontrado.');
        return;
      }
    } else {
      setMessage('Lógica de pagamento para este tipo ainda não implementada ou dados insuficientes.');
      return;
    }

    if (amountToPay <= 0) {
      setMessage('Valor a pagar é zero ou negativo.');
      return;
    }

    try {
      const appId = firebaseConfig.appId;
      const financialTransactionsCollectionRef = collection(db, `artifacts/${appId}/public/data/financial_transactions`);
      await addDoc(financialTransactionsCollectionRef, {
        type: 'outflow',
        category: category,
        amount: amountToPay,
        description: description,
        timestamp: serverTimestamp(),
        recordedBy: userId,
        collaboratorId: selectedCollaboratorId,
      });
      setMessage(`Pagamento de R$ ${amountToPay.toFixed(2)} registrado com sucesso para ${selectedCollab.name}!`);
    } catch (error) {
      console.error("Erro ao registrar pagamento financeiro:", error);
      setMessage(`Erro ao registrar pagamento: ${error.message}`);
    }
  };


  const displayPayments = () => {
    if (!selectedCollaboratorId) return <p className="text-gray-600">Selecione um colaborador para ver os detalhes de pagamento.</p>;

    const selectedCollab = collaborators.find(c => c.id === selectedCollaboratorId);
    if (!selectedCollab || !selectedCollab.paymentConfig) {
      return <p className="text-gray-600">Nenhuma configuração de pagamento para este colaborador.</p>;
    }

    const config = selectedCollab.paymentConfig;
    let paymentInfo = `Tipo de Pagamento: ${config.type.charAt(0).toUpperCase() + config.type.slice(1)}`;
    let amountToPay = 0;

    if (config.type === 'mensal' || config.type === 'diario' || config.type === 'semanal' || config.type === 'quinzenal') {
      if (selectedCollab.salary) {
        amountToPay = selectedCollab.salary;
        if (config.type === 'quinzenal') amountToPay = selectedCollab.salary / 2;
        paymentInfo += ` - Salário Base: R$ ${selectedCollab.salary.toFixed(2)}`;
        paymentInfo += `\nValor estimado a pagar: R$ ${amountToPay.toFixed(2)}`;
      } else {
        paymentInfo += ` - Salário não definido.`;
      }
    } else if (config.type === 'producao') {
      const product = manufacturedProducts.find(p => p.id === config.productionProduct);
      const productName = product ? product.name : 'Produto Desconhecido';
      paymentInfo += ` - Produto: ${productName}, Valor por Unidade: R$ ${config.unitValue.toFixed(2)}`;
      const productionAvailable = product ? product.quantity : 0;
      paymentInfo += `\nProdução disponível para pagamento: ${productionAvailable} unidades.`;
      amountToPay = productionAvailable * config.unitValue;
      paymentInfo += `\nValor estimado a pagar: R$ ${amountToPay.toFixed(2)}`;
    }

    return (
      <div className="bg-white p-4 rounded-md shadow-sm border border-blue-200">
        <h4 className="font-semibold text-blue-800 mb-2">Detalhes de Pagamento para {selectedCollab.name}:</h4>
        <p className="text-gray-700 whitespace-pre-line">{paymentInfo}</p>
        {amountToPay > 0 && (
          <button
            onClick={handleRegisterPayment}
            className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
          >
            Registrar Pagamento de R$ {amountToPay.toFixed(2)}
          </button>
        )}
      </div>
    );
  };


  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Controle de Pagamento</h2>
      <p className="text-gray-600">Organize os pagamentos dos colaboradores com diferentes prazos e opções de pagamento por produção.</p>

      {message && <p className="mt-4 text-center text-sm text-blue-500">{message}</p>}

      {paymentReminders.length > 0 && (
        <div className="mt-6 p-4 bg-yellow-100 border border-yellow-300 rounded-lg shadow-md">
          <h3 className="text-xl font-medium mb-2 text-yellow-800 flex items-center">
            <Bell size={24} className="mr-2" /> Lembretes de Pagamento:
          </h3>
          <ul className="list-disc pl-5 text-yellow-700">
            {paymentReminders.map((reminder, index) => (
              <li key={index}>{reminder}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Configuração de Pagamento */}
      <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
        <h3 className="text-xl font-medium mb-3 text-gray-700">Configurar Pagamento por Colaborador</h3>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="selectCollab">Colaborador:</label>
          <select id="selectCollab" className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500" value={selectedCollaboratorId} onChange={(e) => setSelectedCollaboratorId(e.target.value)}>
            <option value="">Selecione um colaborador</option>
            {collaborators.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Tipo de Pagamento:</label>
          <select className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500" value={paymentType} onChange={(e) => setPaymentType(e.target.value)}>
            <option value="diario">Diário</option>
            <option value="semanal">Semanal</option>
            <option value="quinzenal">Quinzenal</option>
            <option value="mensal">Mensal</option>
            <option value="producao">Por Produção</option>
          </select>
        </div>

        {paymentType === 'producao' && (
          <div className="mb-4 p-3 border border-dashed border-gray-300 rounded-lg bg-white">
            <h4 className="text-md font-semibold mb-2 text-gray-700">Detalhes de Pagamento por Produção</h4>
            <div className="mb-3">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="prodProduct">Produto de Produção:</label>
              <select id="prodProduct" className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500" value={productionProduct} onChange={(e) => setProductionProduct(e.target.value)}>
                <option value="">Selecione o produto</option>
                {manufacturedProducts.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="unitVal">Valor por Unidade Produzida:</label>
              <input type="number" id="unitVal" className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500" value={unitValue} onChange={(e) => setUnitValue(e.target.value)} placeholder="Ex: 0.50" step="0.01" />
            </div>
          </div>
        )}

        <button onClick={handlePaymentSetup} className="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-300">
          Salvar Configuração de Pagamento
        </button>
      </div>

      {/* Exibição de Pagamentos */}
      <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
        <h3 className="text-xl font-medium mb-3 text-gray-700">Visão Geral de Pagamentos</h3>
        {displayPayments()}
      </div>
    </div>
  );
};

// Componente Cadastro de Colaboradores
const CadastroColaboradores = () => {
  const { db, userId } = useContext(AppContext);
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [dob, setDob] = useState(''); // Date of Birth
  const [hireDate, setHireDate] = useState('');
  const [salary, setSalary] = useState('');
  const [workDays, setWorkDays] = useState([]); // Array of selected days
  const [workHoursStart, setWorkHoursStart] = useState('');
  const [workHoursEnd, setWorkHoursEnd] = useState('');
  const [message, setMessage] = useState('');
  const [collaborators, setCollaborators] = useState([]);
  const [collabType, setCollabType] = useState('normal'); // 'normal' ou 'producao'

  const availableDays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

  // Listener para colaboradores
  useEffect(() => {
    if (!db) return;
    const appId = firebaseConfig.appId;
    const collaboratorsCollectionRef = collection(db, `artifacts/${appId}/public/data/collaborators`);
    const unsubscribe = onSnapshot(collaboratorsCollectionRef, (snapshot) => {
      const collabsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCollaborators(collabsList);
    }, (error) => {
      console.error("Erro ao carregar colaboradores:", error);
      setMessage("Erro ao carregar lista de colaboradores.");
    });
    return () => unsubscribe();
  }, [db]);

  const handleDayToggle = (day) => {
    setWorkDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const addCollaborator = async () => {
    if (!db || !name || !cpf || !dob || !hireDate || !salary) {
      setMessage('Por favor, preencha os campos obrigatórios (Nome, CPF, Data de Nascimento, Contratação, Salário).');
      return;
    }

    if (collabType === 'normal' && (workDays.length === 0 || !workHoursStart || !workHoursEnd)) {
      setMessage('Para colaboradores normais, preencha os dias e horários de trabalho.');
      return;
    }

    try {
      const appId = firebaseConfig.appId;
      const collaboratorsCollectionRef = collection(db, `artifacts/${appId}/public/data/collaborators`);

      let workScheduleData = null;
      if (collabType === 'normal') {
        workScheduleData = {
          days: workDays,
          hours: `${workHoursStart}-${workHoursEnd}`,
        };
      }

      await addDoc(collaboratorsCollectionRef, {
        name,
        cpf,
        dob: new Date(dob).toISOString().split('T')[0],
        age: new Date().getFullYear() - new Date(dob).getFullYear(),
        hireDate: new Date(hireDate).toISOString().split('T')[0],
        salary: parseFloat(salary),
        workSchedule: workScheduleData,
        collabType: collabType,
        createdAt: serverTimestamp(),
        createdBy: userId,
      });
      setMessage('Colaborador cadastrado com sucesso!');
      setName('');
      setCpf('');
      setDob('');
      setHireDate('');
      setSalary('');
      setWorkDays([]);
      setWorkHoursStart('');
      setWorkHoursEnd('');
      setCollabType('normal');
    } catch (error) {
      console.error("Erro ao cadastrar colaborador:", error);
      setMessage(`Erro ao cadastrar colaborador: ${error.message}`);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Cadastro de Colaboradores</h2>
      <p className="text-gray-600">Cadastre novos colaboradores com suas informações detalhadas.</p>

      {message && <p className="mt-4 text-center text-sm text-blue-500">{message}</p>}

      {/* Formulário de Cadastro */}
      <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
        <h3 className="text-xl font-medium mb-3 text-gray-700">Novo Colaborador</h3>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Tipo de Colaborador:</label>
          <div className="flex space-x-4">
            <label className="inline-flex items-center">
              <input type="radio" className="form-radio text-blue-600" name="collabType" value="normal" checked={collabType === 'normal'} onChange={() => setCollabType('normal')} />
              <span className="ml-2 text-gray-700">Normal (com ponto e horário)</span>
            </label>
            <label className="inline-flex items-center">
              <input type="radio" className="form-radio text-green-600" name="collabType" value="producao" checked={collabType === 'producao'} onChange={() => setCollabType('producao')} />
              <span className="ml-2 text-gray-700">Por Produção (sem ponto e horário fixo)</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="collabName">Nome:</label>
            <input type="text" id="collabName" className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome Completo" />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="collabCpf">CPF:</label>
            <input type="text" id="collabCpf" className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500" value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00" />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="collabDob">Data de Nascimento:</label>
            <input type="date" id="collabDob" className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500" value={dob} onChange={(e) => setDob(e.target.value)} />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="collabHireDate">Data de Contratação:</label>
            <input type="date" id="collabHireDate" className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500" value={hireDate} onChange={(e) => setHireDate(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="collabSalary">Salário:</label>
            <input type="number" id="collabSalary" className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500" value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="Ex: 1500.00" step="0.01" />
          </div>

          {collabType === 'normal' && (
            <>
              <div className="md:col-span-2">
                <label className="block text-gray-700 text-sm font-bold mb-2">Dias de Trabalho:</label>
                <div className="flex flex-wrap gap-2">
                  {availableDays.map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDayToggle(day)}
                      className={`py-2 px-4 rounded-lg transition duration-200 ${
                        workDays.includes(day) ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="workHoursStart">Horário de Início:</label>
                <input type="time" id="workHoursStart" className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500" value={workHoursStart} onChange={(e) => setWorkHoursStart(e.target.value)} />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="workHoursEnd">Horário de Fim:</label>
                <input type="time" id="workHoursEnd" className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500" value={workHoursEnd} onChange={(e) => setWorkHoursEnd(e.target.value)} />
              </div>
            </>
          )}
        </div>
        <button onClick={addCollaborator} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-300">
          Cadastrar Colaborador
        </button>
      </div>

      {/* Lista de Colaboradores Cadastrados */}
      <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
        <h3 className="text-xl font-medium mb-3 text-gray-700">Colaboradores Cadastrados</h3>
        {collaborators.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg shadow-md">
              <thead>
                <tr className="bg-gray-200 text-gray-700 uppercase text-sm leading-normal">
                  <th className="py-3 px-6 text-left">Nome</th>
                  <th className="py-3 px-6 text-left">CPF</th>
                  <th className="py-3 px-6 text-left">Tipo</th>
                  <th className="py-3 px-6 text-left">Idade</th>
                  <th className="py-3 px-6 text-left">Contratação</th>
                  <th className="py-3 px-6 text-right">Salário</th>
                  <th className="py-3 px-6 text-left">Horário</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 text-sm font-light">
                {collaborators.map(c => (
                  <tr key={c.id} className="border-b border-gray-200 hover:bg-gray-100">
                    <td className="py-3 px-6 text-left whitespace-nowrap">{c.name}</td>
                    <td className="py-3 px-6 text-left">{c.cpf}</td>
                    <td className="py-3 px-6 text-left">{c.collabType === 'producao' ? 'Por Produção' : 'Normal'}</td>
                    <td className="py-3 px-6 text-left">{c.age}</td>
                    <td className="py-3 px-6 text-left">{c.hireDate}</td>
                    <td className="py-3 px-6 text-right">R$ {c.salary.toFixed(2)}</td>
                    <td className="py-3 px-6 text-left">
                      {c.workSchedule ? `${c.workSchedule.days.join(', ')} (${c.workSchedule.hours})` : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600">Nenhum colaborador cadastrado ainda.</p>
        )}
      </div>
    </div>
  );
};

// Componente Financeiro
const Financeiro = () => {
  const { db, userId } = useContext(AppContext);
  const [transactions, setTransactions] = useState([]);
  const [transactionType, setTransactionType] = useState('inflow');
  const [transactionCategory, setTransactionCategory] = useState('');
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionDescription, setTransactionDescription] = useState('');
  const [message, setMessage] = useState('');

  const [dailyLocalCash, setDailyLocalCash] = useState('');
  const [dailyDeliveryCash, setDailyDeliveryCash] = useState('');

  const [deliveryPlatforms, setDeliveryPlatforms] = useState([]);
  const [newPlatformName, setNewPlatformName] = useState('');
  const [newPlatformRate, setNewPlatformRate] = useState('');

  const [deliveryPersons, setDeliveryPersons] = useState([]);
  const [selectedDeliveryPersonId, setSelectedDeliveryPersonId] = useState('');
  const [deliveriesCount, setDeliveriesCount] = useState('');
  const [deliveryPaymentRate, setDeliveryPaymentRate] = useState(5.00);

  const transactionCategories = {
    inflow: ['Venda Local', 'Venda Delivery', 'Outras Receitas'],
    outflow: ['Salário', 'Aluguel', 'Contas (Água, Luz)', 'Matéria-Prima', 'Taxa Delivery', 'Pagamento Entregador', 'Outras Despesas'],
  };

  useEffect(() => {
    if (!db) return;
    const appId = firebaseConfig.appId;
    const transactionsCollectionRef = collection(db, `artifacts/${appId}/public/data/financial_transactions`);
    const unsubscribe = onSnapshot(transactionsCollectionRef, (snapshot) => {
      const transactionsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      transactionsList.sort((a, b) => b.timestamp.toDate() - a.timestamp.toDate());
      setTransactions(transactionsList);
    }, (error) => {
      console.error("Erro ao carregar transações financeiras:", error);
      setMessage("Erro ao carregar transações financeiras.");
    });
    return () => unsubscribe();
  }, [db]);

  useEffect(() => {
    if (!db) return;
    const appId = firebaseConfig.appId;
    const platformsCollectionRef = collection(db, `artifacts/${appId}/public/data/delivery_platforms`);
    const unsubscribe = onSnapshot(platformsCollectionRef, (snapshot) => {
      const platformsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDeliveryPlatforms(platformsList);
    }, (error) => {
      console.error("Erro ao carregar plataformas de delivery:", error);
    });
    return () => unsubscribe();
  }, [db]);

  useEffect(() => {
    if (!db) return;
    const appId = firebaseConfig.appId;
    const collaboratorsCollectionRef = collection(db, `artifacts/${appId}/public/data/collaborators`);
    const unsubscribe = onSnapshot(collaboratorsCollectionRef, (snapshot) => {
      const collabsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDeliveryPersons(collabsList);
    }, (error) => {
      console.error("Erro ao carregar entregadores:", error);
    });
    return () => unsubscribe();
  }, [db]);


  const addTransaction = async () => {
    if (!db || !transactionCategory || !transactionAmount || parseFloat(transactionAmount) <= 0) {
      setMessage('Preencha o tipo, categoria e valor da transação.');
      return;
    }
    try {
      const appId = firebaseConfig.appId;
      const transactionsCollectionRef = collection(db, `artifacts/${appId}/public/data/financial_transactions`);
      await addDoc(transactionsCollectionRef, {
        type: transactionType,
        category: transactionCategory,
        amount: parseFloat(transactionAmount),
        description: transactionDescription,
        timestamp: serverTimestamp(),
        recordedBy: userId,
      });
      setMessage('Transação registrada com sucesso!');
      setTransactionCategory('');
      setTransactionAmount('');
      setTransactionDescription('');
    } catch (error) {
      console.error("Erro ao adicionar transação:", error);
      setMessage(`Erro ao adicionar transação: ${error.message}`);
    }
  };

  const recordDailyCash = async () => {
    if (!db || (parseFloat(dailyLocalCash) <= 0 && parseFloat(dailyDeliveryCash) <= 0)) {
      setMessage('Insira um valor válido para caixa local ou delivery.');
      return;
    }

    try {
      const appId = firebaseConfig.appId;
      const transactionsCollectionRef = collection(db, `artifacts/${appId}/public/data/financial_transactions`);

      if (parseFloat(dailyLocalCash) > 0) {
        await addDoc(transactionsCollectionRef, {
          type: 'inflow',
          category: 'Venda Local',
          amount: parseFloat(dailyLocalCash),
          description: 'Entrada de caixa do dia (Venda Local)',
          timestamp: serverTimestamp(),
          recordedBy: userId,
        });
      }
      if (parseFloat(dailyDeliveryCash) > 0) {
        await addDoc(transactionsCollectionRef, {
          type: 'inflow',
          category: 'Venda Delivery',
          amount: parseFloat(dailyDeliveryCash),
          description: 'Entrada de caixa do dia (Delivery)',
          timestamp: serverTimestamp(),
          recordedBy: userId,
        });
      }
      setMessage('Entradas de caixa diárias registradas com sucesso!');
      setDailyLocalCash('');
      setDailyDeliveryCash('');
    } catch (error) {
      console.error("Erro ao registrar caixa diário:", error);
      setMessage(`Erro ao registrar caixa diário: ${error.message}`);
    }
  };

  const addDeliveryPlatform = async () => {
    if (!db || !newPlatformName || !newPlatformRate || parseFloat(newPlatformRate) <= 0) {
      setMessage('Preencha o nome e a taxa da plataforma de delivery.');
      return;
    }
    try {
      const appId = firebaseConfig.appId;
      const platformsCollectionRef = collection(db, `artifacts/${appId}/public/data/delivery_platforms`);
      await addDoc(platformsCollectionRef, {
        name: newPlatformName,
        discountRate: parseFloat(newPlatformRate),
        createdAt: serverTimestamp(),
      });
      setMessage('Plataforma de delivery adicionada!');
      setNewPlatformName('');
      setNewPlatformRate('');
    } catch (error) {
      console.error("Erro ao adicionar plataforma:", error);
      setMessage(`Erro ao adicionar plataforma: ${error.message}`);
    }
  };

  const handleDeliveryPayment = async () => {
    if (!db || !selectedDeliveryPersonId || !deliveriesCount || parseInt(deliveriesCount) <= 0) {
      setMessage('Selecione um entregador e insira o número de entregas.');
      return;
    }

    const paymentAmount = parseInt(deliveriesCount) * deliveryPaymentRate;
    const selectedPerson = deliveryPersons.find(p => p.id === selectedDeliveryPersonId);

    if (!selectedPerson) {
      setMessage('Entregador não encontrado.');
      return;
    }

    try {
      const appId = firebaseConfig.appId;
      const deliveryPaymentsCollectionRef = collection(db, `artifacts/${appId}/public/data/delivery_person_payments`);
      const financialTransactionsCollectionRef = collection(db, `artifacts/${appId}/public/data/financial_transactions`);

      await addDoc(deliveryPaymentsCollectionRef, {
        deliveryPersonId: selectedDeliveryPersonId,
        deliveryPersonName: selectedPerson.name,
        deliveriesCount: parseInt(deliveriesCount),
        paymentAmount: paymentAmount,
        ratePerDelivery: deliveryPaymentRate,
        timestamp: serverTimestamp(),
        recordedBy: userId,
      });

      await addDoc(financialTransactionsCollectionRef, {
        type: 'outflow',
        category: 'Pagamento Entregador',
        amount: paymentAmount,
        description: `Pagamento de entregas para ${selectedPerson.name} (${deliveriesCount} entregas)`,
        timestamp: serverTimestamp(),
        recordedBy: userId,
      });

      setMessage(`Pagamento de R$ ${paymentAmount.toFixed(2)} registrado para ${selectedPerson.name}!`);
      setSelectedDeliveryPersonId('');
      setDeliveriesCount('');
    } catch (error) {
      console.error("Erro ao registrar pagamento de entregador:", error);
      setMessage(`Erro ao registrar pagamento de entregador: ${error.message}`);
    }
  };

  const financialSummary = transactions.reduce((acc, transaction) => {
    if (transaction.type === 'inflow') {
      acc.totalInflow += transaction.amount;
    } else {
      acc.totalOutflow += transaction.amount;
    }
    acc.balance = acc.totalInflow - acc.totalOutflow;
    return acc;
  }, { totalInflow: 0, totalOutflow: 0, balance: 0 });


  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Controle Financeiro</h2>
      <p className="text-gray-600">Gerencie todas as entradas e saídas financeiras do seu comércio.</p>

      {message && <p className="mt-4 text-center text-sm text-blue-500">{message}</p>}

      <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
        <h3 className="text-xl font-medium mb-3 text-gray-700">Resumo Financeiro</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="bg-green-100 p-4 rounded-lg shadow-sm">
            <p className="text-green-700 font-semibold text-lg">Total de Entradas</p>
            <p className="text-green-900 text-2xl font-bold">R$ {financialSummary.totalInflow.toFixed(2)}</p>
          </div>
          <div className="bg-red-100 p-4 rounded-lg shadow-sm">
            <p className="text-red-700 font-semibold text-lg">Total de Saídas</p>
            <p className="text-red-900 text-2xl font-bold">R$ {financialSummary.totalOutflow.toFixed(2)}</p>
          </div>
          <div className={`p-4 rounded-lg shadow-sm ${financialSummary.balance >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}>
            <p className={`font-semibold text-lg ${financialSummary.balance >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>Saldo Atual</p>
            <p className={`text-2xl font-bold ${financialSummary.balance >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>R$ {financialSummary.balance.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
        <h3 className="text-xl font-medium mb-3 text-gray-700">Registrar Nova Transação</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Tipo:</label>
            <select className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500" value={transactionType} onChange={(e) => {setTransactionType(e.target.value); setTransactionCategory('');}}>
              <option value="inflow">Entrada</option>
              <option value="outflow">Saída</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Categoria:</label>
            <select className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500" value={transactionCategory} onChange={(e) => setTransactionCategory(e.target.value)}>
              <option value="">Selecione uma categoria</option>
              {transactionCategories[transactionType].map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="transAmount">Valor (R$):</label>
            <input type="number" id="transAmount" className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500" value={transactionAmount} onChange={(e) => setTransactionAmount(e.target.value)} placeholder="0.00" step="0.01" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="transDesc">Descrição:</label>
            <textarea id="transDesc" className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500" value={transactionDescription} onChange={(e) => setTransactionDescription(e.target.value)} placeholder="Breve descrição da transação"></textarea>
          </div>
        </div>
        <button onClick={addTransaction} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-300">
          Registrar Transação
        </button>
      </div>

      <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
        <h3 className="text-xl font-medium mb-3 text-gray-700">Entrada de Caixa Diária</h3>
        <p className="text-gray-600 mb-4">Registre as entradas de caixa do dia.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="localCash">Caixa Local (R$):</label>
            <input type="number" id="localCash" className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500" value={dailyLocalCash} onChange={(e) => setDailyLocalCash(e.target.value)} placeholder="0.00" step="0.01" />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="deliveryCash">Caixa Delivery (R$):</label>
            <input type="number" id="deliveryCash" className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500" value={dailyDeliveryCash} onChange={(e) => setDailyDeliveryCash(e.target.value)} placeholder="0.00" step="0.01" />
          </div>
        </div>
        <button onClick={recordDailyCash} className="mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-300">
          Registrar Caixa do Dia
        </button>
      </div>

      <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
        <h3 className="text-xl font-medium mb-3 text-gray-700">Plataformas de Delivery e Taxas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="platformName">Nome da Plataforma:</label>
            <input type="text" id="platformName" className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500" value={newPlatformName} onChange={(e) => setNewPlatformName(e.target.value)} placeholder="Ex: iFood" />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="platformRate">Taxa de Desconto (%):</label>
            <input type="number" id="platformRate" className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500" value={newPlatformRate} onChange={(e) => setNewPlatformRate(e.target.value)} placeholder="Ex: 15.00" step="0.01" />
          </div>
        </div>
        <button onClick={addDeliveryPlatform} className="mt-4 bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-300">
          Adicionar Plataforma
        </button>

        <div className="mt-6">
          <h4 className="text-lg font-medium mb-2 text-gray-700">Plataformas Cadastradas:</h4>
          {deliveryPlatforms.length > 0 ? (
            <ul className="list-disc pl-5 space-y-1">
              {deliveryPlatforms.map(platform => (
                <li key={platform.id} className="text-gray-700">
                  {platform.name}: {platform.discountRate.toFixed(2)}%
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">Nenhuma plataforma cadastrada ainda.</p>
          )}
        </div>
      </div>

      <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
        <h3 className="text-xl font-medium mb-3 text-gray-700">Pagamento de Entregadores</h3>
        <p className="text-gray-600 mb-4">Registre o pagamento por entregas realizadas.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="selectDeliveryPerson">Entregador:</label>
            <select id="selectDeliveryPerson" className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500" value={selectedDeliveryPersonId} onChange={(e) => setSelectedDeliveryPersonId(e.target.value)}>
              <option value="">Selecione um entregador</option>
              {deliveryPersons.map(person => (
                <option key={person.id} value={person.id}>{person.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="deliveriesCount">Número de Entregas:</label>
            <input type="number" id="deliveriesCount" className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500" value={deliveriesCount} onChange={(e) => setDeliveriesCount(e.target.value)} placeholder="0" />
          </div>
          <div className="md:col-span-2">
            <p className="text-gray-700 text-sm">Valor por entrega: R$ {deliveryPaymentRate.toFixed(2)}</p>
            <p className="text-lg font-bold text-gray-800">
              Valor a Pagar: R$ {(parseInt(deliveriesCount) || 0) * deliveryPaymentRate.toFixed(2)}
            </p>
          </div>
        </div>
        <button onClick={handleDeliveryPayment} className="mt-4 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-300">
          Registrar Pagamento Entregador
        </button>
      </div>

      <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
        <h3 className="text-xl font-medium mb-3 text-gray-700">Histórico de Transações</h3>
        {transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg shadow-md">
              <thead>
                <tr className="bg-gray-200 text-gray-700 uppercase text-sm leading-normal">
                  <th className="py-3 px-6 text-left">Data/Hora</th>
                  <th className="py-3 px-6 text-left">Tipo</th>
                  <th className="py-3 px-6 text-left">Categoria</th>
                  <th className="py-3 px-6 text-right">Valor (R$)</th>
                  <th className="py-3 px-6 text-left">Descrição</th>
                  <th className="py-3 px-6 text-left">Registrado Por</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 text-sm font-light">
                {transactions.map(t => (
                  <tr key={t.id} className="border-b border-gray-200 hover:bg-gray-100">
                    <td className="py-3 px-6 text-left whitespace-nowrap">{t.timestamp.toDate().toLocaleString('pt-BR')}</td>
                    <td className="py-3 px-6 text-left">
                      <span className={`font-semibold ${t.type === 'inflow' ? 'text-green-600' : 'text-red-600'}`}>
                        {t.type === 'inflow' ? 'Entrada' : 'Saída'}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-left">{t.category}</td>
                    <td className="py-3 px-6 text-right">{t.amount.toFixed(2)}</td>
                    <td className="py-3 px-6 text-left">{t.description}</td>
                    <td className="py-3 px-6 text-left">{t.recordedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600">Nenhuma transação financeira registrada ainda.</p>
        )}
      </div>
    </div>
  );
};


const AdminPanel = () => {
  const { db, auth, userId, userRole } = useContext(AppContext);
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('colaborador');
  const [message, setMessage] = useState('');
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (db && userRole === 'admin') {
        try {
          const appId = firebaseConfig.appId;
          const usersCollectionRef = collection(db, `artifacts/${appId}/public/data/users`);
          const q = query(usersCollectionRef);
          const querySnapshot = await getDocs(q);
          const usersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setUsers(usersList);
        } catch (error) {
          console.error("Erro ao buscar usuários:", error);
          setMessage("Erro ao buscar usuários.");
        }
      }
    };
    fetchUsers();
  }, [db, userRole]);

  const handleCreateUser = async () => {
    if (!db || !auth || userRole !== 'admin') {
      setMessage('Apenas administradores podem criar usuários.');
      return;
    }

    if (!newUserName) {
      setMessage('O nome do usuário não pode ser vazio.');
      return;
    }

    try {
      const appId = firebaseConfig.appId;
      const usersCollectionRef = collection(db, `artifacts/${appId}/public/data/users`);

      const q = query(usersCollectionRef, where("username", "==", newUserName));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setMessage('Usuário com este nome já existe.');
        return;
      }

      await setDoc(doc(usersCollectionRef, newUserName), {
        username: newUserName,
        role: newUserRole,
        createdAt: new Date().toISOString(),
        createdBy: auth.currentUser?.uid || 'unknown',
      });
      setMessage(`Usuário "${newUserName}" criado com sucesso como "${newUserRole}".`);
      setNewUserName('');
      setNewUserRole('colaborador');
      const updatedUsersCollectionRef = collection(db, `artifacts/${appId}/public/data/users`);
      const updatedQ = query(updatedUsersCollectionRef);
      const updatedQuerySnapshot = await getDocs(updatedQ);
      const updatedUsersList = updatedQuerySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(updatedUsersList);

    } catch (error) {
      console.error("Erro ao criar usuário:", error);
      setMessage(`Erro ao criar usuário: ${error.message}`);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Painel de Administração</h2>
      <p className="text-gray-600">Gerenciamento de usuários e permissões.</p>

      <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
        <h3 className="text-xl font-medium mb-3 text-gray-700">Criar Novo Usuário</h3>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="newUserName">
            Nome de Usuário:
          </label>
          <input
            type="text"
            id="newUserName"
            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
            placeholder="Nome do novo usuário"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="newUserRole">
            Função:
          </label>
          <select
            id="newUserRole"
            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={newUserRole}
            onChange={(e) => setNewUserRole(e.target.value)}
          >
            <option value="colaborador">Colaborador</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
        <button
          onClick={handleCreateUser}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-300"
        >
          Criar Usuário
        </button>
        {message && <p className="mt-3 text-sm text-center text-red-500">{message}</p>}
      </div>

      <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
        <h3 className="text-xl font-medium mb-3 text-gray-700">Usuários Existentes</h3>
        {users.length > 0 ? (
          <ul className="list-disc pl-5">
            {users.map(user => (
              <li key={user.id} className="text-gray-700 mb-1">
                <strong>{user.username}</strong> - Função: {user.role} (ID: {user.id})
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">Nenhum usuário cadastrado ainda.</p>
        )}
      </div>
    </div>
  );
};


// Componente principal da aplicação
const App = () => {
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [currentUserPaymentType, setCurrentUserPaymentType] = useState(null);
  const [currentPage, setCurrentPage] = useState('home');
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    try {
      setDb(firestore); // Use the pre-initialized firestore
      setAuth(firebaseAuth); // Use the pre-initialized firebaseAuth

      const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
        if (user) {
          setUserId(user.uid);
          const appId = firebaseConfig.appId;

          // Busca a função do usuário (admin/colaborador)
          const userDocRef = doc(firestore, `artifacts/${appId}/public/data/users`, user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            setUserRole(userDocSnap.data().role);
          } else {
            setUserRole('colaborador');
          }

          // Busca o tipo de pagamento do colaborador (normal/producao) para o usuário logado
          const collaboratorsCollectionRef = collection(firestore, `artifacts/${appId}/public/data/collaborators`);
          const qCollab = query(collaboratorsCollectionRef, where("createdBy", "==", user.uid));
          const queryCollabSnapshot = await getDocs(qCollab);

          if (!queryCollabSnapshot.empty) {
            const collaboratorData = queryCollabSnapshot.docs[0].data();
            setCurrentUserPaymentType(collaboratorData.collabType || 'normal');
          } else {
            setCurrentUserPaymentType('normal');
          }

        } else {
          setUserId(null);
          setUserRole(null);
          setCurrentUserPaymentType(null);
        }
        setIsAuthReady(true);
      });

      // return () => unsubscribe();
    } catch (error) {
      console.error("Erro na inicialização do Firebase:", error);
    }
  }, []);

  const handleLogout = async () => {
    if (auth) {
      try {
        await signOut(auth);
        console.log("Usuário desconectado.");
        setCurrentPage('login');
      } catch (error) {
        console.error("Erro ao fazer logout:", error);
      }
    }
  };

  const handleLoginSuccess = () => {
    // onAuthStateChanged no useEffect agora é responsável por atualizar o estado do usuário
    // e o App irá renderizar o conteúdo principal automaticamente.
  };

  if (isAuthReady && !userId) {
    return (
      <AppContext.Provider value={{ db, auth, userId, userRole, currentUserPaymentType }}>
        <Login onLoginSuccess={handleLoginSuccess} />
      </AppContext.Provider>
    );
  }

  if (!isAuthReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-xl text-gray-700">Carregando sistema...</div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{ db, auth, userId, userRole, currentUserPaymentType }}>
      <div className="min-h-screen bg-gray-100 font-sans text-gray-900">
        <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 shadow-md">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-3xl font-extrabold">Sistema de Gestão</h1>
            {userId && (
              <div className="flex items-center space-x-4">
                <span className="text-sm">
                  Olá, {userRole === 'admin' ? 'Administrador' : 'Colaborador'}! (ID: {userId})
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
                >
                  <LogOut size={18} className="mr-2" /> Sair
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="flex flex-col md:flex-row">
          <nav className="w-full md:w-64 bg-gray-800 text-white p-4 shadow-lg md:min-h-[calc(100vh-80px)]">
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => setCurrentPage('home')}
                  className={`flex items-center w-full p-3 rounded-lg text-left transition duration-200 ${
                    currentPage === 'home' ? 'bg-blue-700 font-bold' : 'hover:bg-gray-700'
                  }`}
                >
                  <Home size={20} className="mr-3" /> Início
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentPage('ponto')}
                  className={`flex items-center w-full p-3 rounded-lg text-left transition duration-200 ${
                    currentPage === 'ponto' ? 'bg-blue-700 font-bold' : 'hover:bg-gray-700'
                  }`}
                >
                  <Clock size={20} className="mr-3" /> Controle de Ponto
                </button>
              </li>
              {(userRole === 'admin') && (
                <>
                  <li>
                    <button
                      onClick={() => setCurrentPage('estoque')}
                      className={`flex items-center w-full p-3 rounded-lg text-left transition duration-200 ${
                        currentPage === 'estoque' ? 'bg-blue-700 font-bold' : 'hover:bg-gray-700'
                      }`}
                    >
                      <Package size={20} className="mr-3" /> Controle de Estoque
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setCurrentPage('producao')}
                      className={`flex items-center w-full p-3 rounded-lg text-left transition duration-200 ${
                        currentPage === 'producao' ? 'bg-blue-700 font-bold' : 'hover:bg-gray-700'
                      }`}
                    >
                      <Factory size={20} className="mr-3" /> Controle de Produção
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setCurrentPage('pagamento')}
                      className={`flex items-center w-full p-3 rounded-lg text-left transition duration-200 ${
                        currentPage === 'pagamento' ? 'bg-blue-700 font-bold' : 'hover:bg-gray-700'
                      }`}
                    >
                      <DollarSign size={20} className="mr-3" /> Controle de Pagamento
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setCurrentPage('financeiro')}
                      className={`flex items-center w-full p-3 rounded-lg text-left transition duration-200 ${
                        currentPage === 'financeiro' ? 'bg-blue-700 font-bold' : 'hover:bg-gray-700'
                      }`}
                    >
                      <CreditCard size={20} className="mr-3" /> Financeiro
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setCurrentPage('cadastroColaboradores')}
                      className={`flex items-center w-full p-3 rounded-lg text-left transition duration-200 ${
                        currentPage === 'cadastroColaboradores' ? 'bg-blue-700 font-bold' : 'hover:bg-gray-700'
                      }`}
                    >
                      <Users size={20} className="mr-3" /> Cadastro Colaboradores
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setCurrentPage('adminPanel')}
                      className={`flex items-center w-full p-3 rounded-lg text-left transition duration-200 ${
                        currentPage === 'adminPanel' ? 'bg-blue-700 font-bold' : 'hover:bg-gray-700'
                      }`}
                    >
                      <Settings size={20} className="mr-3" /> Painel Admin
                    </button>
                  </li>
                </>
              )}
            </ul>
          </nav>

          <main className="flex-1 p-6 bg-gray-100">
            <div className="container mx-auto">
              {currentPage === 'home' && (
                <div className="p-6 bg-white rounded-lg shadow-md">
                  <h2 className="text-2xl font-semibold mb-4 text-gray-800">Bem-vindo ao Sistema de Gestão!</h2>
                  <p className="text-gray-600">
                    Utilize o menu lateral para navegar entre as funcionalidades.
                  </p>
                  <p className="mt-4 text-gray-600">
                    Seu ID de usuário: <span className="font-mono bg-gray-200 px-2 py-1 rounded text-sm">{userId}</span>
                  </p>
                  <p className="text-gray-600">
                    Sua função: <span className="font-semibold text-blue-700">{userRole}</span>
                  </p>
                </div>
              )}
              {currentPage === 'ponto' && <Ponto />}
              {currentPage === 'estoque' && <Estoque />}
              {currentPage === 'producao' && <Producao />}
              {currentPage === 'pagamento' && <Pagamento />}
              {currentPage === 'financeiro' && <Financeiro />}
              {currentPage === 'cadastroColaboradores' && <CadastroColaboradores />}
              {currentPage === 'adminPanel' && <AdminPanel />}
            </div>
          </main>
        </div>
      </div>
    </AppContext.Provider>
  );
};

export default App;
