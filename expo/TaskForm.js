import React from 'react'
import {View, Button, TextInput, StyleSheet, Text, Alert, ScrollView, Switch} from 'react-native'
import {Picker} from '@react-native-picker/picker'
import DateTimePicker from '@react-native-community/datetimepicker'
import PropTypes from 'prop-types'
import Constants from 'expo-constants'

const styles = StyleSheet.create({
  input: {
    padding: 5,
    borderColor: 'black',
    borderWidth: 1,
  },


  container: {
    flexDirection:'column',
    backgroundColor: `#fbcfa7`,



  },

  containerScroll: {
    flexDirection:'column',
    padding:20,

  },

  picker: {
      height: 30,
      width: 100,
      padding:20,
  },

})

export default class AssignedTaskForm extends React.Component {

  static proptypes = {
    onSubmit: PropTypes.func,
    token: PropTypes.string,
    user: PropTypes.string,
    volverMenu: PropTypes.func,
  }

  constructor(props){
    super(props)
    this.state = {
      date: new Date(),
      name: '',
      tags:[],
      duration: 1,
      people: 1,
      difficulty: 1,
      place: 1,
      alert:false,
      multiple:false,
      info_color:'',
      show_info:false,
    }
  }

  handleNameChange = name => {
    this.setState({name})
  }


  handleSubmit = () => {
    const tags = [this.state.duration, this.state.people, this.state.difficulty, this.state.place]

    fetch(`http://${this.props.host}/tasks/`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${this.props.token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: `${this.state.name}`,
        tags: tags,
        house: this.props.user.house.id,
        multiple: this.state.multiple,
      })
    }).then((response) => {
      if (response.status == 200 || response.status == 201) Alert.alert("",
    "La tarea se ha creado correctamente")
  }).catch((error) => console.log(error))
  }

  componentDidMount(){
    fetch(`http://${this.props.host}/tags/`, {
      method: 'GET',
      headers: {
        Authorization: `Token ${this.props.token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },

    })
    .then((response) => {
      return response.json()
    }).then((tags) => {
      console.log(tags)
      this.setState({tags:tags})
    })
  }

  render() {
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
        <Text style> Crea una nueva tarea para tu hogar: </Text>
        <TextInput
          style = {styles.input}
          value = {this.state.name}
          onChangeText = {this.handleNameChange}
          placeholder = "Nombre de la tarea"
        />
        <View style = {{flexDirection:'row'}}>
          <Text>¿Puede haber varias tareas al día?:</Text>
          <Switch value = {this.state.multiple} onValueChange = {(multiple) => this.setState({multiple})} />
        </View>
        <ScrollView style = {styles.containerScroll}>
          <Text>Eliga su duración estimada:</Text>
          <Picker
            itemStyle = {{fontSize:15}}
            selectedValue = {this.state.duration}
            onValueChange = {(itemValue, itemPosition) => (this.setState({duration:itemValue}))}
          >
          {this.state.tags.filter(tag => tag.group == 1).map((tag) => (
            <Picker.Item key= {tag.id} label={tag.name} value={tag.id} />
            )
          )}
          </Picker>
          <Text>Eliga si es individual o grupal:</Text>
          <Picker

            itemStyle = {{fontSize:15}}
            selectedValue = {this.state.people}
            onValueChange = {(itemValue, itemPosition) => (this.setState({people:itemValue}))}
          >
          {this.state.tags.filter(tag => tag.group == 2).map((tag) => (
            <Picker.Item key= {tag.id} label={tag.name} value={tag.id} />
            )
          )}
          </Picker>
          <Text>Eliga su dificultad estimada:</Text>
          <Picker
            itemStyle = {{fontSize:15}}
            selectedValue = {this.state.difficulty}
            onValueChange = {(itemValue, itemPosition) => (this.setState({difficulty:itemValue}))}
          >
          {this.state.tags.filter(tag => tag.group == 3).map((tag) => (
            <Picker.Item key= {tag.id} label={tag.name} value={tag.id} />
            )
          )}
          </Picker>
          <Text>Eliga si es en el hogar o fuera:</Text>
          <Picker
            itemStyle = {{fontSize:15}}
            selectedValue = {this.state.place}
            onValueChange = {(itemValue, itemPosition) => (this.setState({place:itemValue}))}
          >
          {this.state.tags.filter(tag => tag.group == 4).map((tag) => (
            <Picker.Item key= {tag.id} label={tag.name} value={tag.id} />
            )
          )}
          </Picker>
        </ScrollView>
        <View style = {{marginBottom:40}}>
          <Button  title= "Crear Tarea" onPress = {this.handleSubmit}/>
        </View>
      </View>
    )
  }
}
