import React from 'react'
import {View, Button, TextInput, StyleSheet, Text} from 'react-native'
import PropTypes from 'prop-types'
import Constants from 'expo-constants'
import Register from './Register'

const styles = StyleSheet.create({
  input: {
    padding: 10,
    borderColor: 'black',
    borderWidth: 2,
    borderRadius:15,
    width:100,
  },
  container: {
    alignItems:'center',
    paddingTop: Constants.statusBarHeight,
    justifyContent: 'center',
    flex: 1,
    backgroundColor:`#fbcfa7`,
  },
  title: {
    fontSize: 30,
    marginBottom:30,
  },
})


export default class LogInForm extends React.Component {

  static proptypes = {
    onSubmit: PropTypes.func,
  }

  state = {
    username: '',
    password: '',
    show_register: false,
  }

  handleUsernameChange = username => {
    this.setState({username})

  }

  handlePasswordChange = password => {
    this.setState({password})
  }

  handleSubmit = () => {
    this.props.onSubmit(this.state)
  }

  handleRegister = () => {
    this.setState({show_register:true})
  }

  volverLogIn = () => {
    this.setState({show_register:false})
  }

  render() {
    if (!this.state.show_register) {
      return(
        <View style = {styles.container}>
          <Text style = {styles.title}> Bienvenido a FLATFIX </Text>
          <TextInput
            style = {styles.input}
            value = {this.state.username}
            onChangeText = {this.handleUsernameChange}
            placeholder = "Usuario"
            autoCapitalize='none'
          />
          <TextInput
            style = {styles.input}
            value = {this.state.password}
            onChangeText = {this.handlePasswordChange}
            placeholder = "Contraseña"
            autoCapitalize='none'
            secureTextEntry={true}
          />
          <Button title="Iniciar sesión" onPress = {this.handleSubmit}/>
          <Button title="¿No tienes cuenta? Regístrate" onPress = {this.handleRegister}/>
        </View>
    )}

    if (this.state.show_register) {
      return(
        <Register volverLogIn = {this.volverLogIn} host = {this.props.host}/>
      )
    }
  }
}
