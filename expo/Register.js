import React from 'react'
import {Text, StyleSheet, View, TextInput, Button, Alert} from 'react-native'
import PropTypes from 'prop-types'
import Constants from 'expo-constants'

const styles = StyleSheet.create({
  input: {
    padding: 10,
    borderColor: 'black',
    borderWidth: 2,
    borderRadius:15,
    width: 160,
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

export default class Register extends React.Component {

  static proptypes = {
    volverLogIn: PropTypes.func,
    host: PropTypes.string,
  }

  constructor(props){
    super(props)
    this.state = {
      username: '',
      email: '',
      password: '',
      password2: '',
      first_name:'',
      last_name:'',
      show_house: false,
      code:0,
      token:'',
      
    }
  }

  handleSubmit = props => {
    fetch(`http://${this.props.host}/register/`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: this.state.username,
        password: this.state.password,
        password2: this.state.password2,
        email: this.state.email,
        first_name: this.state.first_name,
        last_name: this.state.last_name,
      })
    }).then((response) => (
        response.json().then(data => ({
        data: data,
        status: response.status
      }))
    )).then((res) => {
        if (res.status !== 201){
          if ("password" in res.data) {
            Alert.alert("Registro incorrecto",
            "Contraseña poco segura. No puede ser demasiado corta ni solo numérica ni demasiado común.")
          }
          else if ("email" in res.data) {
            Alert.alert("Registro incorrecto",
            "este email ya ha sido utilizado.")
          }
          else {
            Alert.alert("Registro incorrecto")
          }
          console.log(res.data)
          throw new Error("Registro incorrecto")
        }
        else {
          return fetch(`http://${host}/api-token-auth/`, {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              username: `${this.state.username}`,
              password: `${this.state.password}`,
            })
          })
        }
    }).then((response) => {
      if(response.status !== 200) {
        Alert.alert("Registro incorrecto")
        throw new Error("LogIn incorrecto")
      }
      Alert.alert("Registro correcto")
      return response.json()
    }).then((data) => {
      this.setState({
        token:data.token,
        show_house:true,
      })
    }).catch(error => {
      console.log(error)
    })
  }

  handleUsernameChange = username => {
    this.setState({username})

  }

  handlePasswordChange = password => {
    this.setState({password})
  }

  handlePassword2Change = password2 => {
    this.setState({password2})
  }

  handleEmailChange = email => {
    this.setState({email})
  }

  handleFirstNameChange = first_name => {
    this.setState({first_name})
  }

  handleLastNameChange = last_name => {
    this.setState({last_name})
  }

  handleCodeChange = code => {
    this.setState({code})
  }

  handleHouseNameChange = house_name => {
    this.setState({house_name})
  }

  joinHouse = () => {
    fetch(`http://${this.props.host}/users/assign_house/`, {
      method: 'PUT',
      headers: {
        Authorization: `Token ${this.state.token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code: this.state.code,

      })
    }).then((response) => {
        if (response.status === 200){
          Alert.alert("Te has unido correctamente al hogar.")
          this.props.volverLogIn()
        }
        else {
          Alert.alert("Este código no es válido.")
        }
    })
  }

  show_create = () => {
    this.setState({show_house:false, show_create:true})
  }

  createHouse = () => {
    fetch(`http://${this.props.host}/houses/`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${this.state.token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: this.state.house_name,
      })
    }).then((response) => {
        if (response.status === 200){
          Alert.alert("Te has unido correctamente al hogar.")
          this.props.volverLogIn()
        }
        else {
          Alert.alert("Este código no es válido.")
        }
    })
  }
  render() {
    if (!this.state.show_house && !this.state.show_create) {
      return(
        <View style = {styles.container}>
          <Text style = {styles.title}> Crea tu cuenta: </Text>
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
          <TextInput
            style = {styles.input}
            value = {this.state.password2}
            onChangeText = {this.handlePassword2Change}
            placeholder = "Repita su contraseña"
            autoCapitalize='none'
            secureTextEntry={true}
          />
          <TextInput
            style = {styles.input}
            value = {this.state.first_name}
            onChangeText = {this.handleFirstNameChange}
            placeholder = "Nombre"
            autoCapitalize='none'
          />
          <TextInput
            style = {styles.input}
            value = {this.state.last_name}
            onChangeText = {this.handleLastNameChange}
            placeholder = "Apellido"
            autoCapitalize='none'
          />
          <TextInput
            style = {styles.input}
            value = {this.state.email}
            onChangeText = {this.handleEmailChange}
            placeholder = "Email"
            autoCapitalize='none'
          />

          <Button title="Regístrate" onPress = {this.handleSubmit}/>
          <Button title = "Volver a Inicio" onPress = {this.props.volverLogIn} />
        </View>
      )
    }

    if (this.state.show_house) {
      return (
        <View style = {styles.container}>
        <Text>Introduce el código del hogar al que te quieres unir.</Text>
        <TextInput
          style = {styles.input}
          value = {this.state.code}
          onChangeText = {this.handleCodeChange}
          placeholder = "Código del hogar"
          secureTextEntry={false}
          keyboardType = 'numeric'
        />
        <Button title = "Únete al hogar" onPress = {this.joinHouse} />
        <Button title="Crea un nuevo hogar" onPress = {this.show_create}/>
        </View>
      )

    if (this.state.show_create) {
      <View style = {styles.container}>
        <Text>Indica el nombre del hogar que quieres añadir:</Text>
        <TextInput
          style = {styles.input}
          value = {this.state.house_name}
          onChangeText = {this.handleHouseNameChange}
          placeholder = "Nombre del hogar"
        />
        <Button title = "Crear" onPress = {this.createHouse} />
      </View>
    }

    }
  }
}
