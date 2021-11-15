import React from 'react'
import {View, ScrollView, Switch, Button, StyleSheet, Text} from 'react-native'
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
    backgroundColor:'white',
    borderRadius:15,
    margin:10,
    borderColor:'black',
    borderWidth:1,
    padding:10,
    paddingLeft:20,
    paddingRight:20,
  },
  title: {
    fontSize: 30
  ,},
})

export default class AssignedTask extends React.Component{
  constructor(props){
    super(props)
    this.state = {
      show_users: false,
      color: 'black',
    }
  }

  componentDidMount(){
    const currentDate = new Date()
    currentDate.setHours(2,0,0,0)
    const redDate = new Date()
    redDate.setDate(currentDate.getDate()+5)
    redDate.setHours(2,0,0,0)
    const greenDate = new Date()
    greenDate.setDate(currentDate.getDate()+10)
    greenDate.setHours(2,0,0,0)

    const date = new Date(this.props.assignedtask.date)

    console.log(currentDate, redDate, greenDate,date)
    if(this.props.assignedtask.checked == false && this.props.assignedtask.undone == false && this.props.record.personal_checked == false) {
      if (redDate >= date) {this.setState({color:'red'})}
      if (greenDate <= date) {this.setState({color:'green'})}
    }

  }
  toggleUsers = () => (this.setState((prevState)=>({show_users: !prevState.show_users})))
  render(){
    return(
      <View style= {styles.assignedtaskcontainer}>
        <View style = {{flexDirection:'row',}}>
          <Switch value={this.props.record.personal_checked} onValueChange={this.props.onToggle} />
          <Text style = {{color: this.state.color}}>{" "+ this.props.assignedtask.task.name + " "}</Text>

        </View>
        <Text>{"Fecha: " + this.props.assignedtask.date}</Text>
        <Button title="Usuarios" onPress={this.toggleUsers}/>
        {this.state.show_users && (
          <ScrollView >
          {this.props.assignedtask.users.map(user => (<Text key={user.id}>{user.username}</Text>))}
          </ScrollView>
          )
        }

      </View>
    )

  }

}
