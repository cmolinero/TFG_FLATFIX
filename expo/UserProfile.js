import React from 'react'
import {View, Button, TextInput, StyleSheet, Text, Alert, ScrollView, Switch} from 'react-native'
import PropTypes from 'prop-types'
import Constants from 'expo-constants'

const styles = StyleSheet.create({
  container: {
    flexDirection:'column',
    alignItems:'center',
    paddingTop: Constants.statusBarHeight,
    justifyContent: 'flex-start',
    flex:1,
    backgroundColor:`#fbcfa7`,
  },
})


//TODO: El user solo se le hace update. SEGUIR MIRANDO ESTO CON EL LIKE DISLIKE

class LikeTask extends React.Component {

  constructor(props){
    super(props)
    this.state = {
      liked: this.props.user.liked_tasks.includes(this.props.task.id),
    }
    console.log("Este es el valor inicial", this.state.liked, this.props.task.name, this.props.task.id)
  }

  toggleLike(value, id) {
    this.setState({liked:value})
    console.log("Este es el valor que recibe el toggle", value, this.props.task.name, this.props.task.id)
    if (value) {
      fetch(`http://${this.props.host}/tasks/${id}/like_task/`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${this.props.token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },

      })
      .then((response) => {
        if(response.status == 200){
          Alert.alert("",
        "La tarea se ha añadido a tus favoritas.")
        }
        else {
          Alert.alert("",
        "Ya tienes tres tareas que te gustan.")
        this.setState({liked:!value})
        }
      })
    }

    if (!value){
      fetch(`http://${this.props.host}/tasks/${id}/like_task/`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${this.props.token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },

      })
      .then((response) => {
        if(response.status == 200){
          Alert.alert("",
        "La tarea se ha quitado de tus favoritas.")
        }
        else{
          Alert.alert("",
        "Has de quitar primero una de las que no te gustan.")
        this.setState({liked:!value})
        }
      })
    }
  }

  render(){
    return(
      <View style = {{flexDirection:'row', justifyContent:'space-around', backgroundColor:'white', borderRadius:15, borderWidth:1, margin:10, padding:10}}>
        <Switch value = {this.state.liked} onValueChange = {(value) => this.toggleLike(value,this.props.task.id)}/>
        <Text>{this.props.task.name}</Text>
      </View>
    )
  }
}

class DislikeTask extends React.Component {

  constructor(props){
    super(props)
    this.state = {
      disliked: this.props.user.disliked_tasks.includes(this.props.task.id),
    }
    console.log("Este es el valor inicial", this.state.disliked, this.props.task.name, this.props.task.id)
  }
  toggleLike(value, id){
    this.setState({disliked:value})
    console.log("Este es el valor que recibe el toggle", value, this.props.task.name, this.props.task.id)
    if (value) {
      fetch(`http://${this.props.host}/tasks/${id}/dislike_task/`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${this.props.token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },

      })
      .then((response) => {
        if(response.status == 200){
          Alert.alert("",
        "La tarea se ha añadido a tus indeseadas.")
        }
        else if (response.status == 403){
          Alert.alert("",
        "Ya tienes tres tareas que no te gustan.")
          this.setState({disliked:!value})
        }
        else {
          Alert.alert("",
        "No puedes añadir otra que no te gusta hasta que añadas otra que sí.")
          this.setState({disliked:!value})
        }
      })
    }

    if (!value){
      fetch(`http://${this.props.host}/tasks/${id}/dislike_task/`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${this.props.token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },

      })
      .then((response) => {
        if(response.status == 200){
          Alert.alert("",
        "La tarea se ha quitado de tus indeseadas.")
        }
        else {
          Alert.alert("",
        "La")
        console.log(response.status)
        }
        }


      )
    }
  }

  render(){
    return(
      <View style = {{flexDirection:'row', justifyContent:'space-around', backgroundColor:'white', borderRadius:15, borderWidth:1, margin:10, padding:10}}>
        <Switch trackColor = {{true:'red', false:'grey'}} value = {this.state.disliked} onValueChange = {(value) => this.toggleLike(value,this.props.task.id)}/>
        <Text>{this.props.task.name}</Text>
      </View>
    )
  }
}

export default class UserProfile extends React.Component {

  static proptypes = {
    user: PropTypes.object,
    token: PropTypes.string,
    host: PropTypes.string,
  }

  state = {
    tasks: [],
    show_liked_tasks: false,
    show_disliked_tasks: false,
    user: this.props.user,
    liked_color: '',
    disliked_color: '',
    show_info: false,
    info_color:'',
  }

  componentDidMount(){
    fetch(`http://${this.props.host}/tasks/`, {
      method: 'GET',
      headers: {
        Authorization: `Token ${this.props.token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },

    })
    .then((response) => {
      return response.json()
    }).then((tasks) => {
      console.log(tasks)
      this.setState({tasks:tasks})
    }).then(() => {
      return (fetch(`http://${this.props.host}/users/get_personal_user/`, {
        method: 'GET',
        headers: {
          Authorization: `Token ${this.props.token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },

      })
    )}).then((response) => {
      return response.json()
    }).then((user) => {
      this.setState({user:user, show_liked_tasks:true, liked_color:'red'})
    })
  }

  showLikedTasks = () => {


    fetch(`http://${this.props.host}/users/get_personal_user/`, {
      method: 'GET',
      headers: {
        Authorization: `Token ${this.props.token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },

    }).then((response) => {
    return response.json()
    }).then((user) => {
      if (this.state.liked_color === 'red') {
        this.setState({liked_color:''})
      } else {
        this.setState({liked_color:'red', disliked_color:''})
      }
      this.setState({user:user})
      this.setState((prevState) => ({show_liked_tasks:!prevState.show_liked_tasks, show_disliked_tasks:false,
      }))
    })

  }

  showDislikedTasks = () => {
    fetch(`http://${this.props.host}/users/get_personal_user/`, {
      method: 'GET',
      headers: {
        Authorization: `Token ${this.props.token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },

    }).then((response) => {
    return response.json()
    }).then((user) => {
      if (this.state.disliked_color === 'red') {
        this.setState({disliked_color:''})
      } else {
        this.setState({disliked_color:'red', liked_color:''})
      }
      this.setState({user:user})
      this.setState((prevState) => ({show_disliked_tasks:!prevState.show_disliked_tasks, show_liked_tasks:false,
      }))
    })
  }




  render() {
    return(
      <View style = {styles.container}>
        <View style = {{flexDirection:'row', marginBottom:30}}>
          <Button title = "Volver al menú" onPress = {this.props.volverMenu} />
          <View style = {{marginLeft:50, marginRight:50}}></View>
          <Button title = 'Ayuda' color = {this.state.info_color} onPress = {()=>{
            if (this.state.info_color === '') {
              this.setState((prevState)=>({show_info:!prevState.show_info, info_color:'red'}))
            }
            else {
              this.setState((prevState)=>({show_info:!prevState.show_info, info_color:''}))
            }
          }} />
        </View>
        <View style = {{margin:10, backgroundColor:'white', borderRadius:15, borderWidth:1, margin:10, padding:10}}>
        <Text>Tu puntuación es de {this.state.user.personal_rating}</Text>
        </View>
        <Text style = {{margin:10}}>Elige qué tareas te gustan y cuáles no:</Text>
        {this.state.show_info && (
          <View style = {{backgroundColor:'white', borderRadius:15, borderWidth:1}}>
            <Text style = {{margin:10}}>Únicamente puedes tener 3 tareas que te gustan y 3 tareas que no.</Text>
            <Text style = {{margin:10}}>Siempre has de tener más tareas que te gustan para seleccionar las que no.</Text>
          </View>
        )}
        <View style = {{flexDirection:'row',}}>
          <Button color = {this.state.liked_color} title="Te gustan" onPress = {this.showLikedTasks}/>
          <View style = {{margin:15}}></View>
          <Button color = {this.state.disliked_color} title= "No te gustan" onPress = {this.showDislikedTasks}/>
        </View>
        {this.state.show_liked_tasks && (
          <ScrollView style = {{margin:20}}>
            {this.state.tasks.map((task) => (
              <LikeTask key = {task.id} host = {this.props.host} user = {this.state.user}
              token = {this.props.token} task = {task} />
            ))}
          </ScrollView>
        )}
        {this.state.show_disliked_tasks && (
          <ScrollView style = {{marginTop:20}}>
            {this.state.tasks.map((task) => (
              <DislikeTask key = {task.id} host = {this.props.host} user = {this.state.user}
              token = {this.props.token} task = {task} />
            ))}
          </ScrollView>
        )}

      </View>
    )
  }
}
