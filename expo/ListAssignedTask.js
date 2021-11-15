import React from 'react'
import {View, Switch, Button, StyleSheet, Text, Alert, ScrollView} from 'react-native'
import Constants from 'expo-constants'
import AssignedTask from './AssignedTask'



const styles = StyleSheet.create({
  container: {
    flexDirection:'column',
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
    fontSize: 30
  ,},
})




export default class ListAssignedTasks extends React.Component{
  constructor(props){
    super(props)
    this.state = {
      records: [],
      current_records: [],
      history_records: [],
      show_current: true,
      show_history: false,
      current_color: 'red',
      history_color:'',
      show_info: false,
      info_color: '',
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
      return (fetch(`http://${this.props.host}/userstasksrecords/get_personal_records/`, {
          method: 'GET',
          headers: {
            Authorization: `Token ${this.props.token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json'
          },

        }))
    }).then((response) => {
      return response.json()
    }).then((records) => {
      console.log(records)
      this.setState({records: records})
    })
  }

  toggleAssignedTask(record_id, assigned_task_id){
    fetch(`http://${this.props.host}/assignedtasks/${assigned_task_id}/user_check/`,{
      method: 'GET',
      headers: {
        Authorization: `Token ${this.props.token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },

    }).then((response) => {

      if (response.status == 200) {
        this.setState({
        records: this.state.records.map(record => {
          if (record.id !== record_id) return record
          return {
            ...record,
            personal_checked: !record.personal_checked,
            }
          })
        })
        Alert.alert(
          "Check realizado correctamente",
          "",)
     }
     if (response.status !== 200) {
       Alert.alert(
         "No se ha podido hacer Check",
         "La tarea ya ha sido checkeada por el moderador, o bien ya se ha cumplido la fecha.",)
     }
    })
  }

  toggleCurrent = () => {
    if (this.state.current_color === 'red') {
      this.setState({current_color:''})
    } else {
      this.setState({current_color:'red', history_color:''})
    }
    this.setState((prevState) => ({show_current:!prevState.show_current, show_history:false,
    }))
  }

  toggleHistory = () => {
    if (this.state.history_color === 'red') {
      this.setState({history_color:''})
    } else {
      this.setState({history_color:'red', current_color:''})
    }
    this.setState((prevState) => ({show_history:!prevState.show_history, show_current:false,
    }))
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
        <Text>Selecciona qué tareas asignadas quieres ver:</Text>
        {this.state.show_info && (
          <View style = {{backgroundColor:'white', borderRadius:15, margin:10, borderWidth:1}}>
            <Text style = {{margin:10}}>En Actuales verás todas las tareas que se te han asignado y aún no has completado. Cuando realices una,
            tan solo haz check en ella.</Text>
            <Text style = {{margin:10}}>En Historial verás todas las tareas que has completado o se ha vencido la fecha.</Text>
          </View>
        )}
        <View style = {{flexDirection:'row', marginTop:30}}>
          <Button color = {this.state.current_color} title="Actuales" onPress = {this.toggleCurrent}/>
          <View style = {{margin:30}}></View>
          <Button color = {this.state.history_color} title="Historial" onPress = {this.toggleHistory}/>
        </View>
        {(this.state.show_current) && (
          <View>
            <Text style= {{marginBottom:20, fontWeight:'bold'}}> Tareas asignadas sin hacer: {this.state.records
              .filter(record => !record.personal_checked && record.assigned_task.checked == false && record.assigned_task.undone == false)
              .length} </Text>
            <ScrollView>
              {this.state.records.filter(record => !record.personal_checked && record.assigned_task.checked == false && record.assigned_task.undone == false)
              .map(record => <AssignedTask key = {record.id} assignedtask = {record.assigned_task} record = {record}
              onToggle = {() => this.toggleAssignedTask(record.id, record.assigned_task.id)}
              />)}
            </ScrollView>
          </View>
        )}

        {(this.state.show_history) && (
          <ScrollView>
            {this.state.records.filter(record => (record.assigned_task.undone == true || record.assigned_task.checked == true || record.personal_checked == true))
              .map(record => <AssignedTask key = {record.id} assignedtask = {record.assigned_task} record = {record}
            onToggle = {() => this.toggleAssignedTask(record.id, record.assigned_task.id)}
            />)}
          </ScrollView>
        )}

      </View>
  )
}

}
