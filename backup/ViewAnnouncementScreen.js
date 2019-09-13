import React, {PropTypes} from 'react'
import {Text, View, StyleSheet, TouchableOpacity} from 'react-native'
import {connect} from 'react-redux'
import Actions from '../../../../Actions/Creators'
import Icon from 'react-native-vector-icons/Ionicons'
import ActionButton from 'react-native-action-button'
import {Actions as NavigationActions, ActionConst} from 'react-native-router-flux'
import MomentsTab from '../../../../Components/MomentsTab'
import Image from 'react-native-image-progress'
import {Globals, Func, Fetch, Storage} from '../../../../Utils/'
import {screenStyle, listStyle as ls} from '../../../Styles/Common/'
import Avatar from '../../../../Components/Avatar'
import Announcement from '../../../../Components/Announcement'

class ViewAnnouncementScreen extends React.Component{

  constructor(props){
    super(props)
		this.state = {
			announcement: {
				announcementId: null,
				attachmentPath: null,
				title: '',
				body: '',
				appSendOn: null,
				appCreatedDate: null,
				firstName: '',
				lastName: '',
				date: null,
				time: null
			}
		}
  }
  
  componentDidMount(){
	  var a = this.props.Announcement
	  this.setState({ announcement: a })
	  NavigationActions.refresh({ title: a.title })
  }
  
  handleDeleteAnnouncement(rd){
	  Func.ask('Are you sure?','Delete Announcement',[
			
			{text:'Yes',onPress: ()=>{ 
			
				this.deleteAnnouncement(rd)
			  
			}},
			
			{text: 'Cancel', style: 'cancel'}
	  ])
	  
  }
  
  async deleteAnnouncement(rd){
	  try{
		  var del = await Fetch.put('Announcement/DeleteAnnouncement?AnnouncementId=' + rd.announcementId),
					aDB = await Storage.doLoad(Globals.db.aDB),
					aRes = aDB.data
		  
			aRes.map((el, index) => {
			  if(el.announcementId === rd.announcementId) aRes.splice(index,1)
		  })
	  
			Storage.doSave(Globals.db.aDB,{data:aRes})
	  
			this.props.updateAnnouncementScreen(true)
		  
		  this.setState({ announcement: {} })
		  
		  NavigationActions.pop()
	  }
	  catch(err){
		  Func.error('Something went wrong')
	  }
  }
 
  /*render(){
	  
	const { announcement } = this.state
	
	var attachment = announcement.attachmentPath,
      is_image = Func.is_image(attachment)

	var img = is_image ? <View style={{marginBottom:10}}>
											  <Image source={{uri:Globals.s3 + attachment}} style={{resizeMode:'cover'}} height={200} />
											</View> : null

	var doc = is_image === false ?
      <TouchableOpacity
        onPress={ ()=> web('http://www.hisendi.com/sendi/m.php/attachment/announcement/' + announcement.announcementId)}>
        <View style={[ls.item,{flexDirection:'row',justifyContent:'center'}]}>
          <Text style={{fontSize:10,color:'teal',textAlign:'center',marginRight:5}}>
            To download this attachment, click to open in mobile browser
          </Text>
          <Icon name='ios-arrow-forward' size={14} color='teal' />
        </View>
      </TouchableOpacity> : null
	  
	var actionBtn = <TouchableOpacity style={{width:20}} onPress={this.handleDeleteAnnouncement.bind(this,announcement)}>
										<Icon name='ios-close' size={30} />
									</TouchableOpacity>
	
  return (
			<View style={{flex:1,marginTop:60}}>
					<View style={[ls.item,{borderBottomWidth:0}]}>
							
							<View style={ls.body}>
						<View style={ls.left}>
						  <Avatar source={announcement} size={30} />
						</View>

						<View style={ls.center}>
							<View style={{flexDirection:'row'}}>
								<TouchableOpacity style={{flex:1}}>
									<Text style={ls.centerPrimary}>{announcement.title}</Text>
								</TouchableOpacity>
								
								{this.props.isConnected && actionBtn}
							</View>
						  <Text style={[ls.centerSecondary,{fontSize:12}]}>by {announcement.firstName} {announcement.lastName}</Text>
						  <Text style={[ls.centerSecondary,{fontSize:10}]}>{announcement.date} at {announcement.time}</Text>
						</View>
					  </View>
					</View>

					<View style={[ls.item,{borderBottomColor:'#eee',paddingHorizontal:0}]}>
            {(attachment && attachment != '') && img}
						<View style={{paddingHorizontal:20}}>
							<Text>{announcement.body}</Text>
						</View>
					</View>

					{(attachment && attachment != '') && doc}
      </View>
    )
  }*/
  
  render(){
	  
	  var { announcement } = this.state
	  
	  return (
			<Announcement data={announcement} onDelete={this.handleDeleteAnnouncement.bind(this,announcement)} />
	  )
  }
}

const styles = StyleSheet.create({
  container:{
	  flex:1,
	  backgroundColor:'#f3f3f3'
  }
})

const mapStateToProps = (state) => {
  return {
	  isConnected: state.network.isConnected
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
	  updateAnnouncementScreen: (updateScreen) => dispatch(Actions.updateAnnouncementScreen(updateScreen))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ViewAnnouncementScreen)