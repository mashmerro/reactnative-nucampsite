import React, { Component } from 'react';
import { Text, View, ScrollView, FlatList, Modal, Button, StyleSheet, Alert, PanResponder, Share } from 'react-native';
import { Card, Icon, Rating, Input } from 'react-native-elements';
import * as Animatable from 'react-native-animatable';  // Much easier to use this library than import { Animated } from 'react-native';
import { connect } from 'react-redux';                  // connects state from redux
import { baseUrl } from '../shared/baseUrl';            // json-server
import { postFavorite, postComment } from '../redux/ActionCreators'; // favoriting the campsite state

const mapStateToProps = state => {  // receive state as a prop
    return {
        campsites: state.campsites,
        comments: state.comments,
        favorites: state.favorites
    };
};

const mapDispatchToProps = {
    postFavorite: campsiteId => (postFavorite(campsiteId)),
    postComment: (campsiteId, rating, author, text) => (postComment(campsiteId, rating, author, text))
};

function RenderCampsite(props) {   // De-structure campsite array
    const {campsite} = props;

    const view = React.createRef();

    const recognizeDrag = ({dx}) => (dx < -200) ? true : false; 
    // 'dx' : property distance of gesture across x-axis
    //        -> return true if less than -200px, false if not

    const recognizeComment = ({dx}) => (dx > 200) ? true : false;

    const panResponder = PanResponder.create({
        onStartShouldSetPanResponder: () => true,   // activate pan responder to respond to gestures
        onPanResponderGrant: () => {
            view.current.rubberBand(1000)
            .then(endState => console.log(endState.finished ? 'finished' : 'canceled'));
        },
        onPanResponderEnd: (e, gestureState) => {   // 2 params
            console.log('pan responder end', gestureState);
            if (recognizeDrag(gestureState)) {
                Alert.alert(        // 4 params
                    'Add Favorite', // Title header
                    'Are you sure you wish to add ' + campsite.name + ' to favorite?',  // Message dialogue
                    [
                        {   // Cancel button
                            text: 'Cancel',
                            style: 'cancel',
                            onPress: () => console.log('Cancel Pressed')
                        },
                        {   // Ok button
                            text: 'OK',
                            onPress: () => props.favorite ? console.log('Already set as a favorite') : props.markFavorite()
                        }
                    ],
                    { cancelable: false }   // User can't tap outside the box to close
                );
            }
            else if (recognizeComment(gestureState)) {
                props.onShowModal()
            }

            return true;
        }
    });

    // Button to share for socials
    const shareCampsite = (title, message, url) => {
        Share.share({
            title,
            message: `${title}: ${message} ${url}`,
            url
            // For android: url not required but message is  | For ios: must have either or both
        }, {    // Extra configuration
            dialogTitle: 'Share ' + title       // for android
        });
    };

    if (campsite) { // if campsite object has something
        return (
            <Animatable.View animation='fadeInDown' 
                             duration={2000} 
                             delay={1000}
                             ref={view}
                             {...panResponder.panHandlers} // spread out panResponder's panHandlers and combine to one object to make it a prop for Animatable
            > 
                <Card featuredTitle={campsite.name}
                      image={{uri: baseUrl + campsite.image}}>
                    <Text style={{margin:10}}>
                        {campsite.description}
                    </Text>
                    <View style={styles.cardRow}>
                        <Icon name={props.favorite ? 'heart' : 'heart-o'}      // name of the icon: if props is true (favorite), icon is solid heart, else- not solid (not favorite)
                            type='font-awesome'     // where icon is from
                            color='#f50'
                            raised                  // subtle shadow effect
                            reverse                 // reverse color scheme
                            onPress={() => props.favorite ? console.log('Already set as a favorite') : props.markFavorite()}    // if already a favorite, it won't do anything but console.log
                        />
                        <Icon name='pencil'
                            type='font-awesome'
                            color='#5637DD'
                            raised
                            reverse
                            onPress={() => props.onShowModal()}
                        />
                        <Icon name={'share'}
                            type='font-awesome'
                            color='#5637DD'
                            raised
                            reverse
                            onPress={() => shareCampsite(campsite.name, campsite.description, baseUrl + campsite.image)}
                        />
                    </View>
                </Card>
            </Animatable.View>
        );
    }
    return <View />;    // if campsite doesn't have anything, return an empty View (= </div>)
}

// Show Card of comments description
function RenderComments({comments}) {   //De-structure comments array
    const renderCommentItem = ({item}) => {
        return(
            <View style={{margin: 10}}>
                <Text style={{fontSize: 14}}>{item.text}</Text>
                <Rating readonly startingValue={item.rating}
                        imageSize={10}
                        style={{alignItems: 'flex-start', paddingVertical: '5%'}}
                />
                <Text style={{fontSize: 12}}>{`-- ${item.author}, ${item.date}`}</Text>
            </View>
        );
    };

    return(
        <Animatable.View animation='fadeInUp' duration={2000} delay={1000}>
            <Card title='Comments'>
                <FlatList data={comments}                             // data always takes an array 
                        renderItem={renderCommentItem}              // calls renderCommentItem
                        keyExtractor={item => item.id.toString()}   // extracts comments id from # to a string
                />
            </Card>
        </Animatable.View>
    );
}

class CampsiteInfo extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showModal: false,
            rating: 5,
            author: '',
            text: ''
        };
    };

    toggleModal() {
        this.setState({showModal: !this.state.showModal});
    }

    handleComment(campsiteId) {
        this.props.postComment(campsiteId, this.state.rating, this.state.author, this.state.text);
        this.toggleModal();
    }

    resetForm() {
        this.setState({
            showModal: false,
            rating: 5,
            author: '',
            text: ''
        })
    }

    markFavorite(campsiteId) {
        this.props.postFavorite(campsiteId);    // change state
    }

    static navigationOptions = {
        title: 'Campsite Information'
    }

    render() { 
        const campsiteId = this.props.navigation.getParam('campsiteId');
        const campsite = this.props.campsites.campsites.filter(campsite => campsite.id === campsiteId)[0];
        const comments = this.props.comments.comments.filter(comment => comment.campsiteId === campsiteId);
        return (
            <ScrollView>
                <RenderCampsite campsite={campsite} 
                                favorite={this.props.favorites.includes(campsiteId)}
                                markFavorite={() => this.markFavorite(campsiteId)}
                                onShowModal={() => this.toggleModal()}
                />
                <RenderComments comments={comments} />
                <Modal animationType={'slide'}
                       transparent={false}
                       visible={this.state.showModal}
                       onRequestClose={() => this.toggleModal()}
                >
                    <View style={styles.modal}>
                        <Rating showRating
                                startingValue={this.state.rating}
                                imageSize={40}
                                onFinishRating={rating => this.setState({rating: rating})}
                                style={{paddingVertical: 10}}
                        />
                        <Input placeholder='Author'
                               leftIcon={{type: 'font-awesome', name: 'user-o'}}
                               leftIconContainerStyle={{paddingRight: 10}}
                               onChangeText={author => this.setState({author: author})}
                               value={this.state.author}
                        />
                        <Input placeholder='Comment'
                               leftIcon={{type: 'font-awesome', name: 'comment-o'}}
                               leftIconContainerStyle={{paddingRight: 10}}
                               onChangeText={text => this.setState({text: text})}
                               value={this.state.text}
                        />
                        <View style={{margin: 10}}>
                            <Button title='Submit'
                                    color='#5637DD'
                                    onPress={() => {this.handleComment(campsiteId); this.resetForm();}}
                            />
                        </View>
                        <View style={{margin: 10}}>
                            <Button onPress={() => { this.toggleModal(); }} 
                                    color= '#808080'
                                    title='Cancel'
                            />
                        </View>
                    </View>       
                </Modal>
            </ScrollView>
        );
    }
}

const styles = StyleSheet.create({
    cardRow: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        flexDirection: 'row',
        margin: 20
    },
    modal: {
        justifyContent: 'center',
        margin: 20
    }
})
export default connect(mapStateToProps, mapDispatchToProps)(CampsiteInfo);  // receive state arrays from redux store