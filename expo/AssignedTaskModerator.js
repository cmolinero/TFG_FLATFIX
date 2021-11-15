import React from 'react'
import {View, ScrollView, Switch, Button, StyleSheet, Text, Alert} from 'react-native'
import Constants from 'expo-constants'


const styles = StyleSheet.create({
  container: {
    alignItems:'center',
    paddingTop: Constants.statusBarHeight,
    justifyContent: 'center',
    flex: 1,
    flexDirection: 'column',
  },
  assignedtaskcontainer: {
    flexDirection: 'column',
    alignItems:'center',
    flex: 1,
    borderRadius:15,
    backgroundColor:'white',
    borderWidth:1,
    padding:10,
    marginBottom:10,
  },
  title: {
    fontSize: 30
  ,},
})

const RecordModerator = props => (
    <View>
      <Switch value={props.record.moderator_checked} onValueChange={props.onToggle}/>
      <Text>{props.record.user.username}</Text>
    </View>
  )


export default class AssignedTaskModerator extends React.Component{
  constructor(props){
    super(props)
    this.state = {
      show_users: false,
      records: [],
    }
  }

  toggleUsers = () => {

    this.setState((prevState)=>({show_users: !prevState.show_users}))

  }

  componentDidMount(){

    fetch(`http://${this.props.host}/assignedtasks/${this.props.assignedtask.id}/get_records/`, {
        method: 'GET',
        headers: {
          Authorization: `Token ${this.props.token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },

      })
      .then((response) => {
        return response.json()
      }).then((records) => {
        this.setState({records: records})

      })
  }

  toggleRecord(id) {
    fetch(`http://${this.props.host}/userstasksrecords/${id}/moderator_check/`,{
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
          if (record.id !== id) return record
          return {
            ...record,
            moderator_checked: !record.moderator_checked,
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
         "La tarea ya está checkeada globalmente, o bien ya se ha cumplido la fecha.",)
     }
    })
  }


  render(){
    return(
      <View style= {styles.assignedtaskcontainer}>
        <View style = {{flexDirection:'row',}}>
          <Switch value={this.props.assignedtask.checked} onValueChange={this.props.onToggle} />
          <Text>{" "+ this.props.assignedtask.task.name + "   "}</Text>
          <Text>{"Fecha: " + this.props.assignedtask.date}</Text>
        </View>
        <Button title="Usuarios" onPress={this.toggleUsers}/>

        {this.state.show_users && (
          <ScrollView>
          {this.state.records.map(record => (
            <RecordModerator key = {record.id} record = {record} onToggle = {() => this.toggleRecord(record.id)} />
          ))}
          </ScrollView>
        )}

      </View>
    )
  }
}
