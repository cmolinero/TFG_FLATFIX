import React from 'react'
import {StyleSheet, View, ScrollView, Button, Text, Switch,Alert} from 'react-native'
import Constants from 'expo-constants'
import PropTypes from 'prop-types'
import ListAssignedTasks from './ListAssignedTask'
import AssignedTask from './AssignedTask'
import LogInForm from './LogInForm'
import AssignedTaskForm from './AssignedTaskForm'
import TaskForm from './TaskForm'
import ModeratorList from './ModeratorList'
import CalendarTask from './CalendarTask'
import UserProfile from './UserProfile'

const host = '192.168.5.73:8001'

const styles = StyleSheet.create({
  container: {
    alignItems:'center',
    paddingTop: Constants.statusBarHeight,
    justifyContent: 'flex-start',
    flex: 1,
    backgroundColor:`#fbcfa7`,
  },
  assignedtaskcontainer: {
    flexDirection: 'row',
    alignItems:'center',
    flex: 1,
  },
  title: {
    fontSize: 30,
  },
})



export default class App extends React.Component{

  constructor(){
    super()
    this.state = {
      user: null,
      token: null,
      login: true,
      menu: false,
      personal_list:false,
      create_assignedtask:false,
      create_task:false,
      moderator_list:false,
      calendar_task: false,
      is_moderator:false,
      info: false,
      profile:false,
      notifications:[],
    }
  }

  logInHandler = props => {

    fetch(`http://${host}/api-token-auth/`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: `${props.username}`,
        password: `${props.password}`,
      })
    }).then((response) => {
      if(response.status !== 200) {
        Alert.alert("LogIn incorrecto")
        throw new Error("LogIn incorrecto")
      }
      this.setState({
        login: false,
        menu: true,
      })
      return response.json()
    }).then((data) => {
      this.setState({
        token:data.token,
      })
    }).then(() => { return fetch(`http://${host}/users/get_personal_user/`, {
      method: 'GET',
      headers: {
        Authorization: `Token ${this.state.token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
    })}).then((response) => {
      return response.json()
    }).then((user) => {
      this.setState({user:user, info:true})
    })
    .then(() => { return fetch(`http://${host}/houses/${this.state.user.house.id}/choose_moderator/`, {
      method: 'GET',
      headers: {
        Authorization: `Token ${this.state.token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
    })})
    .then(() => { return fetch(`http://${host}/houses/${this.state.user.house.id}/check_time_tasks/`, {
      method: 'GET',
      headers: {
        Authorization: `Token ${this.state.token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
    })})
    .then(() => {return fetch(`http://${host}/users/is_moderator/`, {
      method: 'GET',
      headers: {
        Authorization: `Token ${this.state.token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },

    })})
    .then((response) => {
      return response.json()
    }).then((is_moderator) => {
      this.setState({is_moderator: is_moderator})
    }).then(() => {return fetch(`http://${host}/notifications/`, {
      method: 'GET',
      headers: {
        Authorization: `Token ${this.state.token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
    })}).then((response) => {
      return response.json()
    }).then((notifications)=>{
      this.setState({notifications:notifications})
    }).catch(error => {
      console.log(error)
    })

  }

  createAssignedtaskHandler = props => {

  }

  irAssignedTaskList(){
    this.setState({
      menu: false,
      personal_list: true,
    })
  }

  irCreateAssignedTask(){
    this.setState({
      menu: false,
      create_assignedtask: true,
    })
  }

  irCreateTask(){
    this.setState({
      menu: false,
      create_task: true,
    })
  }

  irProfile(){
    this.setState({
      menu: false,
      profile: true,
    })
  }

  irModeratorAssignedTask(){
    this.setState({
    menu: false,
    moderator_list: true,
  })
  }

  irCalendarTask(){
    this.setState({
    menu: false,
    calendar_task: true,
  })
  }

  volverMenu(){
    this.setState({
      menu: true,
      personal_list: false,
      moderator_list: false,
      create_assignedtask: false,
      calendar_task: false,
      create_task: false,
      profile:false,
    })
  }

  volverLogIn(){
    this.setState({
      menu: false,
      login: true,
    })
  }



  render(){
    if (this.state.login) return(
      <LogInForm onSubmit={this.logInHandler} host = {host}/>
    )

    if (this.state.menu) return(
      <View style = {styles.container}>
        <View>
          <Button title = "Cerrar sesión" onPress = {()=>this.volverLogIn()}/>
        </View>
        {(this.state.info) && (
          <Text style={[styles.title, {margin:30, marginTop:30}]}> Bienvenido {this.state.user.username} a tu hogar {this.state.user.house.name}: </Text>
        )
        }
        {(this.state.is_moderator) && (
          <View style = {{margin:10, borderRadius:15, borderWidth:1, padding:5, backgroundColor:'white'}}>
            <Text> Esta semana eres tú el moderador </Text>
          </View>
        )}
        <View style = {{justifyContent:'center', marginTop:10}}>
          <Button title = "Ver tus tareas" onPress = {()=>this.irAssignedTaskList()}/>
          {(this.state.is_moderator) && (<Button title = "Sección del moderador" onPress = {()=>this.irModeratorAssignedTask()}/>)}
          <Button title = "Asignar tarea" onPress = {()=>this.irCreateAssignedTask()}/>
          <Button title = "Crear tarea" onPress = {()=>this.irCreateTask()}/>
          <Button title = "Calendario" onPress = {()=>this.irCalendarTask()}/>
          <Button title = "Tu perfil" onPress = {()=>this.irProfile()}/>

          <View style = {{backgroundColor:'white', borderColor:'black', borderWidth:1, borderRadius:15, alignItems:'center', justifyConter:'center', margin:20, marginBottom:5}} >
            <Text style = {{fontWeight: "bold", marginBottom:5, marginTop:5}} >Tablón de noticias</Text>
            {this.state.notifications.map((notification)=>(
              <Text key = {notification.id} style = {{margin:10}}>{notification.text}</Text>
            ))}
          </View>

        </View>
      </View>
    )

    if (this.state.personal_list) return(
      <ListAssignedTasks token = {this.state.token} user = {this.state.user} host = {host} volverMenu = {()=>this.volverMenu()}/>
    )

    if (this.state.moderator_list) return(
      <ModeratorList token = {this.state.token} user = {this.state.user} host = {host} volverMenu = {()=>this.volverMenu()}/>
    )

    if (this.state.create_assignedtask) return(
      <AssignedTaskForm onSubmit={this.createAssignedtaskHandler} token = {this.state.token} user = {this.state.user} host = {host} volverMenu = {()=>this.volverMenu()}/>
    )

    if (this.state.create_task) return(
      <View style = {styles.container}>
        <TaskForm onSubmit={this.createTaskHandler} token = {this.state.token} user = {this.state.user} host = {host} volverMenu = {()=>this.volverMenu()}/>
      </View>
    )

    if (this.state.calendar_task) return(
      <CalendarTask token = {this.state.token} user = {this.state.user} host = {host} volverMenu = {()=>this.volverMenu()}/>
    )

    if (this.state.profile) return(
      <UserProfile token = {this.state.token} user = {this.state.user} host = {host} volverMenu = {()=>this.volverMenu()}/>
    )
  }
}
