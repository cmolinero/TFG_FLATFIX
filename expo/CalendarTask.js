import React from 'react'
import {View, Button, TextInput, StyleSheet, Text, ScrollView} from 'react-native'
import {Picker} from '@react-native-picker/picker'
import DateTimePicker from '@react-native-community/datetimepicker'
import PropTypes from 'prop-types'
import Constants from 'expo-constants'
import {Calendar, CalendarList, Agenda} from 'react-native-calendars'

const styles = StyleSheet.create({
  container: {
    flexDirection:'column',
    paddingTop: Constants.statusBarHeight,
    justifyContent: 'space-around',
    flex:1,
    backgroundColor: `#fbcfa7`,
  },
  assignedtaskcontainer: {
    flexDirection: 'column',
    alignItems:'center',
    flex: 1,
    backgroundColor:'white',
    borderRadius:15,
    margin:5,
    borderWidth:1,
    padding:10,
  },
  title: {
    fontSize: 30
  ,},

})


class CalendarTask extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      show_users: false,
      string_date:'',
      date:'',
    }
  }

  toggleUsers = () => (this.setState((prevState)=>({show_users: !prevState.show_users})))

  render(){
    return(
      <View style= {styles.assignedtaskcontainer}>
        <View style = {{flexDirection:'row'}}>
          <Text>{" "+ this.props.assignedtask.task.name + " "}</Text>
          <Text>{"Fecha: " + this.props.assignedtask.date}</Text>
        </View>
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

export default class CalendarApp extends React.Component {

  static proptypes = {
    token: PropTypes.string,
    user: PropTypes.string,
  }

  constructor(props){
    super(props)
    const date = new Date()
    this.state = {
      date: date,
      assignedtasks: [],
      token: props.token,
      user: props.user,
      markedDates: {},
      info_color:'',
      show_info:false,
    }
  }




  handleDateChange = (selectedDate) => {

    // const year = selectedDate.getFullYear();
    // const  month = selectedDate.getMonth()+1;
    // const day= selectedDate.getDate();
    // const stringDate = year + '-' + month + '-' + day
    fetch(`http://${this.props.host}/assignedtasks/get_assignedtasks_by_day/`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${this.state.token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        date: `${selectedDate.dateString}`,
      })
    }).then((response) => {
      return response.json()
    }).then((assignedtasks) => {
      this.setState({assignedtasks: assignedtasks,
      date: selectedDate,
    string_date: selectedDate.dateString})
    })

  }

  getTaskMonth=(month)=>{
    console.log(month)
    const date = new Date()
    const year = date.getFullYear()
    fetch(`http://${this.props.host}/assignedtasks/get_assignedtasks_by_month/`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${this.state.token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        month: `${month}`,
        year: `${year}`,
      })

    })
    .then((response) => {
      return response.json()
    }).then((markedDates) => {
      console.log("ey")
      console.log(markedDates)
      this.setState({markedDates:markedDates})
    })
  }

  componentDidMount(){
    const date = new Date()
    const month = date.getMonth()+1
    const year = date.getFullYear();
    // const  month = selectedDate.getMonth()+1;
    const day= date.getDate();
    const stringDate = year + '-' + month + '-' + day
    this.getTaskMonth(month)
    fetch(`http://${this.props.host}/assignedtasks/get_assignedtasks_by_day/`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${this.state.token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        date: stringDate,
      })
    }).then((response) => {
      return response.json()
    }).then((assignedtasks) => {
      this.setState({assignedtasks: assignedtasks, string_date:stringDate})
    })

  }





  render() {
    return(
      <View style = {styles.container}>
        <View style = {{flexDirection:'row', marginBottom:30, marginLeft:35}}>
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
            <Text style = {{margin:10}}>Con este calendario podrás visualizar el reparto de tareas en tu hogar. Haciendo click en cada día podrás
            desplegar las tareas que hay que realizar. </Text>
            <Text style = {{margin:10}}>Podemos encontrarnos un punto debajo de un día. Si el punto es rojo, significa que una de las tareas
            has de realizarla tú. Si el punto es azul, significa que hay tareas para hacer ese día, pero ninguna has de realizarla tú.</Text>
          </View>
        )}
        <Text> Selecciona un día para ver las tareas a realizar en la casa: </Text>
        <Calendar
        markedDates={this.state.markedDates}

          theme = {{
            backgroundColor:`#fbcfa7`,
            calendarBackground:`#fbcfa7`,
            textSectionTitleColor: 'black',
          }}
          onDayPress = {(day) => {this.handleDateChange(day)}}
          onMonthChange = {(date) => {this.getTaskMonth(date.month)}}
        />
        <Text style = {{marginLeft:150, marginTop:20, fontWeight:'bold'}}> {this.state.string_date} </Text>
        <ScrollView style = {{margin:20, padding:20}}>
          {this.state.assignedtasks.map((assignedtask)=>(
            <CalendarTask key = {assignedtask.id} assignedtask = {assignedtask} />
          ))}
        </ScrollView>
      </View>
    )
  }
}
