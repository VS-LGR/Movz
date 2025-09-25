import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import SideMenu from '../../components/SideMenu';

const { width, height } = Dimensions.get('window');

const ChatScreen = ({ isMenuVisible, setIsMenuVisible, onNavigate, currentUser }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: 'Oi pessoal! Quem quer jogar vôlei hoje?',
      isUser: false,
      timestamp: '14:30',
    },
    {
      id: 2,
      text: 'Eu topo! Que horas?',
      isUser: true,
      timestamp: '14:32',
    },
    {
      id: 3,
      text: 'Que tal às 16h na quadra da escola?',
      isUser: false,
      timestamp: '14:33',
    },
    {
      id: 4,
      text: 'Perfeito! Vou levar a bola',
      isUser: true,
      timestamp: '14:35',
    },
    {
      id: 5,
      text: 'Alguém tem dicas para melhorar o saque?',
      isUser: false,
      timestamp: '14:40',
    },
  ]);
  
  const [newMessage, setNewMessage] = useState('');
  const scrollViewRef = useRef(null);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const sendMessage = () => {
    if (newMessage.trim()) {
      const message = {
        id: messages.length + 1,
        text: newMessage.trim(),
        isUser: true,
        timestamp: new Date().toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
      };
      
      setMessages([...messages, message]);
      setNewMessage('');
      
      // Simulate receiving a response after 1 second
      setTimeout(() => {
        const responses = [
          'Concordo!',
          'Boa ideia!',
          'Vamos fazer isso!',
          'Perfeito!',
          'Top demais!',
        ];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        const responseMessage = {
          id: messages.length + 2,
          text: randomResponse,
          isUser: false,
          timestamp: new Date().toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
        };
        
        setMessages(prev => [...prev, responseMessage]);
      }, 1000);
    }
  };

  const renderMessage = (message) => (
    <View
      key={message.id}
      style={[
        styles.messageContainer,
        message.isUser ? styles.userMessageContainer : styles.otherMessageContainer,
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          message.isUser ? styles.userMessageBubble : styles.otherMessageBubble,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            message.isUser ? styles.userMessageText : styles.otherMessageText,
          ]}
        >
          {message.text}
        </Text>
        <Text
          style={[
            styles.messageTime,
            message.isUser ? styles.userMessageTime : styles.otherMessageTime,
          ]}
        >
          {message.timestamp}
        </Text>
      </View>
      {/* Message tail */}
      <View
        style={[
          styles.messageTail,
          message.isUser ? styles.userMessageTail : styles.otherMessageTail,
        ]}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>Movz</Text>
          <TouchableOpacity 
            style={styles.menuIcon} 
            onPress={() => setIsMenuVisible(true)}
          >
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
          </TouchableOpacity>
        </View>

        {/* Chat Title */}
        <Text style={styles.chatTitle}>Chat com amigos</Text>
        <Text style={styles.chatDescription}>
          Converse com seus amigos de turma, marque jogos, troque conhecimento.
        </Text>

        {/* Divider Line */}
        <View style={styles.divider} />

        {/* Messages Container */}
        <View style={styles.messagesContainer}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesScrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.messagesContent}
          >
            {messages.map(renderMessage)}
          </ScrollView>
        </View>

        {/* Input Container */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Digite sua mensagem..."
            placeholderTextColor="#999"
            multiline
            maxLength={500}
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <View style={styles.sendButtonIcon} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      
      {/* Side Menu */}
      <SideMenu 
        isVisible={isMenuVisible} 
        onClose={() => setIsMenuVisible(false)}
        onNavigate={onNavigate}
        currentUser={currentUser}
        onLogout={onLogout}
        userType="STUDENT"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E9EDEE',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Poppins',
  },
  menuIcon: {
    width: 39,
    height: 18,
    justifyContent: 'space-between',
  },
  menuLine: {
    width: 39,
    height: 6,
    backgroundColor: '#D9D9D9',
    borderRadius: 3,
  },
  chatTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'Poppins',
  },
  chatDescription: {
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
    fontFamily: 'Poppins',
  },
  divider: {
    height: 1,
    backgroundColor: '#000',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    marginHorizontal: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  messagesScrollView: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    paddingBottom: 10,
  },
  messageContainer: {
    marginBottom: 15,
    maxWidth: '80%',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 12.4,
    elevation: 8,
  },
  userMessageBubble: {
    backgroundColor: '#FEDB8A',
  },
  otherMessageBubble: {
    backgroundColor: '#FEDB8A',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    fontFamily: 'Poppins',
  },
  userMessageText: {
    color: '#000',
  },
  otherMessageText: {
    color: '#000',
  },
  messageTime: {
    fontSize: 12,
    marginTop: 5,
    fontFamily: 'Poppins',
  },
  userMessageTime: {
    color: '#666',
    textAlign: 'right',
  },
  otherMessageTime: {
    color: '#666',
    textAlign: 'left',
  },
  messageTail: {
    width: 0,
    height: 0,
    position: 'absolute',
    bottom: 0,
  },
  userMessageTail: {
    right: -10,
    borderLeftWidth: 10,
    borderLeftColor: '#FEDB8A',
    borderTopWidth: 10,
    borderTopColor: 'transparent',
    borderBottomWidth: 10,
    borderBottomColor: 'transparent',
  },
  otherMessageTail: {
    left: -10,
    borderRightWidth: 10,
    borderRightColor: '#FEDB8A',
    borderTopWidth: 10,
    borderTopColor: 'transparent',
    borderBottomWidth: 10,
    borderBottomColor: 'transparent',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#D9D9D9',
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    minHeight: 50,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    fontFamily: 'Poppins',
    maxHeight: 100,
    paddingVertical: 5,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#B5B5B5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  sendButtonIcon: {
    width: 16,
    height: 16,
    backgroundColor: '#666',
    borderRadius: 8,
  },
});

export default ChatScreen;
