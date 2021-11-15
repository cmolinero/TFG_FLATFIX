import React from 'react'
import {Text, View, ScrollView, Button, Switch, StyleSheet, Alert} from 'react-native'
import Constants from 'expo-constants'
import AssignedTaskModerator from './AssignedTaskModerator'

const styles = StyleSheet.create({
  container: {
    alignItems:'center',
    paddingTop: Constants.statusBarHeight,
    justifyContent: 'center',
    flex: 1,
    backgroundColor:`#fbcfa7`,
  },
  assignedtaskcontainer: {
    flexDirection: 'row',
    alignItems:'center',
    flex: 1,
  },
  title: {
    fontSize: 30
  ,},
})



export default class ModeratorList extends React.Component{
  constructor(props){
    super(props)
    this.state = {
      assignedtasks: [],
      token: props.token,
      user: props.user,
      info_color:'',

    }
  }

  componentDidMount(){
    fetch(`http://${this.props.host}/houses/${this.props.user.house.id}/assign_next_tasks/`, {
      method: 'GET',
      headers: {
        Authorization: `Token ${this.props.token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
    })
    .then(()=>{
      return (fetch(`http://${this.props.host}/houses/${this.props.user.house.id}/undone_tasks/`, {
          method: 'GET',
          headers: {
            Authorization: `Token ${this.props.token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json'
          },

        }))
    }).then(()=>{
      return (fetch(`http://${this.props.host}/assignedtasks/get_moderator_tasks/`, {
        method: 'GET',
        headers: {
          Authorization: `Token ${this.state.token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
      }))
    }).then((response) => {
      return response.json()
    }).then((assignedtasks) => {
      console.log(assignedtasks)
      this.setState({assignedtasks: assignedtasks})
    })
  }

  toggleAssignedTask(id){
    fetch(`http://${this.props.host}/assignedtasks/${id}/global_check/`,{
      method: 'GET',
      headers: {
        Authorization: `Token ${this.state.token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },

    }).then((response) => {

      if (response.status == 200) {
        this.setState({
        assignedtasks: this.state.assignedtasks.map(assignedtask => {
          if (assignedtask.id !== id) return assignedtask
          return {
            ...assignedtask,
            checked: !assignedtask.checked,
            }
          })
        })
        Alert.alert(
          "Check realizado correctamente",
          "",)
     }
     if (response.status !== 200) {
       Alert.alert(
         "No se ha podido hacer Check Global",
         "La tarea ya ha sido checkeada globalmente, o bien ya se ha cumplido la fecha.",)
     }
    })
  }



  render(){
    return(
      <View style = {styles.container}>
        <View style = {{flexDirection:'row', marginBottom:30}}>
          <Button title = "Volver al menú" onPress = {()=>this.props.volverMenu()} />
          <View style = {{marginLeft:50, marginRight:50}}></View>
          <Button color = {this.state.info_color} title = 'Ayuda' onPress = {()=>{
            if (this.state.info_color === '') {
              this.setState((prevState)=>({show_info:!prevState.show_info, info_color:'red'}))
            }
            else {
              this.setState((prevState)=>({show_info:!prevState.show_info, info_color:''}))
            }
          }} />
        </View>
        {this.state.show_info && (
          <View style = {{backgroundColor:'white', borderRadius:15, margin:10, borderWidth:1}}>
            <Text style = {{margin:10}}>Aquí encuentras todas las tareas pendientes de checkear por parte del moderador.</Text>
            <Text style = {{margin:10}}>Por un lado, sobre cada tarea, si clickas en Usuarios, podrás hacer un click a cada uno de ellos si ha hecho
            o no su parte de la tarea. Una vez que hayas completado esto, podrás hacer un check global sobre la tarea para darla por finalizada y archivarla.</Text>
          </View>
        )}
        <Text style= {{marginBottom:20, fontWeight:'bold'}}> Tareas sin comprobar: {this.state.assignedtasks.filter(assignedtask => !assignedtask.checked).length} </Text>
        <ScrollView>
          {this.state.assignedtasks.map((assignedtask)=>(
              <AssignedTaskModerator key = {assignedtask.id} assignedtask = {assignedtask}
              onToggle = {() => this.toggleAssignedTask(assignedtask.id)}
              token = {this.state.token}
              host = {this.props.host}
              />
          ))}
        </ScrollView>
      </View>
    )
  }
}
