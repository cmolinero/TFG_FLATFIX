import React from 'react'
import {View, Button, TextInput, StyleSheet, Text, Alert, Platform} from 'react-native'
import {Picker} from '@react-native-picker/picker'
import DateTimePicker from '@react-native-community/datetimepicker'
import PropTypes from 'prop-types'
import Constants from 'expo-constants'

//TODO he puesto new Date en el value del datepicker para que funcione el cancel más o menos.
const styles = StyleSheet.create({
  input: {
    padding: 5,
    borderColor: 'black',
    borderWidth: 2,
    borderRadius:15,
    margin:10,
  },


  container: {
    flexDirection:'column',
    paddingTop: Constants.statusBarHeight,
    justifyContent: 'flex-start',
    flex:1,
    backgroundColor:`#fbcfa7`,

  },


})

export default class AssignedTaskForm extends React.Component {

  static proptypes = {
    onSubmit: PropTypes.func,
    token: PropTypes.string,
    user: PropTypes.string,
  }

  constructor(props){
    super(props)
    this.state = {
      date: new Date(),
      nusers: '',
      task: 1,
      tasks: [],
      token: props.token,
      user: props.user,
      task_users: '',
      alert:false,
      show_unique: false,
      show_routine: false,
      period:'',
      multiple:false,
      day_time: 0,
      show_date_picker:false,
      unique_color:'',
      routine_color:'',
      info_color:'',
      show_info:false,
    }
  }

  handleNusersChange = nusers => {
    this.setState({nusers})
  }

  handlePeriodChange = period => {
    this.setState({period})
  }


  handleSubmit = () => {
    if (this.state.show_unique) this.handleUniqueSubmit()
    if (this.state.show_routine) this.handleRoutineSubmit()
  }

  handleUniqueSubmit = () => {
    const year = this.state.date.getFullYear();
    const  month = this.state.date.getMonth()+1;
    const  day= this.state.date.getDate();
    const stringDate = year + '-' + month + '-' + day

    console.log(stringDate)
    fetch(`http://${this.props.host}/tasks/${this.state.task}/create_single_task/`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${this.state.token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        date: stringDate,
        n_users: this.state.nusers,
        day_time: this.state.day_time,
      })
    }).then((response) => {
      if (response.status == 422) {
        Alert.alert(
          "La tarea no se ha creado",
          "Una tarea de este tipo para este mismo horario ya existe."
        )
        throw new Error("Tarea ya existente")
      }

      if (response.status == 200) {
        return response.json()
      }
      }).then((assignedtask) => {
        console.log(assignedtask)
        let task_users = "La tarea ha sido asignada a: \n"
        assignedtask.users.map(user => (task_users = task_users + user.username + "\n"))
        this.setState({task_users: task_users})
        Alert.alert("",
      task_users,)
        }).catch(error => console.log(error))

    this.props.onSubmit(this.state)
  }


  handleRoutineSubmit = () => {
    const year = this.state.date.getFullYear();
    const  month = this.state.date.getMonth()+1;
    const  day= this.state.date.getDate();
    const stringDate = year + '-' + month + '-' + day
    fetch(`http://${this.props.host}/tasks/${this.state.task}/create_routine/`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${this.state.token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        date: stringDate,
        n_users: this.state.nusers,
        period: this.state.period,
      })
    }).then((response) => {
      if (response.status == 200) {
        Alert.alert(
          "Rutina creada",
          "Se irán asignando las rutinas conforme llegue su fecha de realización",
        )}


      }).catch(error => console.log(error))




    this.props.onSubmit(this.state)
  }
  componentDidMount(){
    fetch(`http://${this.props.host}/tasks/`, {
      method: 'GET',
      headers: {
        Authorization: `Token ${this.state.token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },

    })
    .then((response) => {
      return response.json()
    }).then((tasks) => {
      console.log(tasks)
      this.setState({tasks:tasks})
    })
  }

  handleDateChange = (event, selectedDate) => {
    if (event.type === 'cancelButtonPressed') Alert.alert("Has")
    const currentDate = selectedDate || this.state.date
    this.setState({date:selectedDate})
    this.setState({show_date_picker:(Platform.OS === 'ios')})
  }

  toggleUnique = () => {
    if (this.state.unique_color === 'red') {
      this.setState({unique_color:''})
    } else {
      this.setState({unique_color:'red', routine_color:''})
    }
    if (!this.state.show_routine) {
      this.setState((prevState)=>({show_date_picker: !prevState.show_date_picker,}))
    }
    this.setState((prevState)=>({show_unique: !prevState.show_unique, show_routine:false,}))
  }
  toggleRoutine = () => {
    if (this.state.routine_color === 'red') {
      this.setState({routine_color:''})
    } else {
      this.setState({routine_color:'red', unique_color:''})
    }
    if (!this.state.show_unique){
      this.setState((prevState)=>({show_date_picker: !prevState.show_date_picker,}))
    }
    this.setState((prevState)=>({show_routine: !prevState.show_routine, show_unique:false,}))

  }



  render() {
    return(
      <View style = {styles.container}>
        <View style = {{flexDirection:'row', marginBottom:30, marginLeft:40}}>
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
        <Text style = {{marginLeft:30}}> Asigna una de las tareas disponibles en tu hogar: </Text>
          <Picker style = {{marginTop:40}}
            selectedValue = {this.state.task}
            onValueChange = {(itemValue, itemIndex) => (this.setState({task:itemValue, multiple:this.state.tasks[itemIndex].multiple}))}
          >
          {this.state.tasks.map((task) => (
            <Picker.Item key= {task.id} label={task.name} value={task.id} />
            )
          )}
          </Picker>

          <View style = {{marginTop:60}}>
            <Button color = {this.state.unique_color} title="Asignar tarea única" onPress = {this.toggleUnique}/>
            <Button color = {this.state.routine_color} title="Crear una rutina" onPress = {this.toggleRoutine}/>
          </View>

          {(this.state.show_unique||this.state.show_routine) && (
            <View>
              {(this.state.show_date_picker) && (
                <View>
                  <DateTimePicker style= {{marginLeft:140, marginTop:30, marginBottom:10}} value = {this.state.date || new Date()} onChange = {this.handleDateChange} />

                </View>
              )}
              <TextInput
                style = {styles.input}
                value = {this.state.nusers}
                onChangeText = {this.handleNusersChange}
                keyboardType = 'numeric'
                placeholder = "Número de usuarios"
              />
              {(!this.state.show_routine && this.state.multiple) && (
                <Picker
                  selectedValue = {this.state.day_time}
                  onValueChange = {(itemValue, itemIndex) => (this.setState({day_time:itemValue}))}
                >

                  <Picker.Item  label={"Mañana"} value={1} />
                  <Picker.Item  label={"Tarde"} value={2} />
                  <Picker.Item  label={"Noche"} value={3} />


                </Picker>
              )}
              {(this.state.show_routine) && (
                <TextInput
                  style = {styles.input}
                  value = {this.state.period}
                  onChangeText = {this.handlePeriodChange}
                  placeholder = "Número de días entre cada tarea"
                  keyboardType = 'numeric'
                />

              )}
              <Button title= "Asignar Tarea" onPress = {this.handleSubmit}/>
            </View>
            )
          }

      </View>
    )
  }
}
